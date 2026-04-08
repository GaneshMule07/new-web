import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  getDoc,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Plus, 
  LogOut, 
  User as UserIcon, 
  ShoppingBag, 
  Image as ImageIcon, 
  Video, 
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

// Types
interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'designer' | 'client';
  bio?: string;
}

interface Design {
  id: string;
  designerId: string;
  designerName: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  tags: string[];
  price: number;
  createdAt: any;
}

interface Order {
  id: string;
  clientId: string;
  designerId: string;
  designId: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  requirements: string;
  price: number;
  createdAt: any;
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        } else {
          // New user defaults to client
          const newUserData: UserData = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || '',
            role: 'client',
          };
          await setDoc(doc(db, 'users', user.uid), newUserData);
          setUserData(newUserData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Designs Listener
  useEffect(() => {
    const q = query(collection(db, 'designs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const designsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Design));
      setDesigns(designsData);
    });
    return unsubscribe;
  }, []);

  // Orders Listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'orders'), 
      where(userData?.role === 'designer' ? 'designerId' : 'clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
    });
    return unsubscribe;
  }, [user, userData]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Logged in successfully!');
    } catch (error) {
      toast.error('Login failed. Please check your Firebase config.');
    }
  };

  const handleLogout = () => {
    signOut(auth);
    toast.info('Logged out.');
  };

  const filteredDesigns = designs.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <Toaster position="top-center" />
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">DH</div>
              DesignHub
            </h1>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-500">
              <button 
                onClick={() => setActiveTab('explore')}
                className={`hover:text-zinc-900 transition-colors ${activeTab === 'explore' ? 'text-zinc-900' : ''}`}
              >
                Explore
              </button>
              {user && (
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`hover:text-zinc-900 transition-colors ${activeTab === 'orders' ? 'text-zinc-900' : ''}`}
                >
                  Orders
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                placeholder="Search designs..." 
                className="pl-9 w-64 bg-zinc-100 border-none focus-visible:ring-zinc-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                {userData?.role === 'designer' && (
                  <UploadDesignDialog designer={userData} />
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Avatar className="w-9 h-9 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={user.photoURL || ''} />
                      <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Profile Settings</DialogTitle>
                      <DialogDescription>Manage your account and preferences.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={user.photoURL || ''} />
                          <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{user.displayName}</h3>
                          <p className="text-sm text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Account Type</label>
                        <div className="flex gap-2">
                          <Button 
                            variant={userData?.role === 'client' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={async () => {
                              const updated = { ...userData!, role: 'client' as const };
                              await setDoc(doc(db, 'users', user.uid), updated);
                              setUserData(updated);
                              toast.success('Switched to Client mode');
                            }}
                          >
                            Client
                          </Button>
                          <Button 
                            variant={userData?.role === 'designer' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={async () => {
                              const updated = { ...userData!, role: 'designer' as const };
                              await setDoc(doc(db, 'users', user.uid), updated);
                              setUserData(updated);
                              toast.success('Switched to Designer mode');
                            }}
                          >
                            Designer
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="destructive" onClick={handleLogout} className="w-full">
                        <LogOut className="w-4 h-4 mr-2" /> Log Out
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Button onClick={handleLogin} className="bg-zinc-900 text-white hover:bg-zinc-800">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'explore' ? (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero */}
              <section className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white p-12 md:p-24">
                <div className="relative z-10 max-w-2xl space-y-6">
                  <Badge className="bg-white/10 text-white border-none px-4 py-1">Premium Marketplace</Badge>
                  <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9]">
                    Where Vision Meets <span className="text-zinc-400">Design.</span>
                  </h2>
                  <p className="text-lg text-zinc-400 max-w-lg">
                    Connect with world-class designers or showcase your creative portfolio to global clients.
                  </p>
                  <div className="flex gap-4 pt-4">
                    <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-200">
                      Get Started <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                    <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10">
                      View Showcase
                    </Button>
                  </div>
                </div>
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-zinc-800/50 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-zinc-800/30 rounded-full blur-3xl pointer-events-none" />
              </section>

              {/* Design Grid */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold tracking-tight">Featured Designs</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full">
                      <Filter className="w-4 h-4 mr-2" /> All Categories
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredDesigns.map((design) => (
                    <DesignCard key={design.id} design={design} currentUser={user} />
                  ))}
                  {filteredDesigns.length === 0 && (
                    <div className="col-span-full py-24 text-center space-y-4">
                      <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8 text-zinc-400" />
                      </div>
                      <h4 className="text-xl font-semibold">No designs found</h4>
                      <p className="text-zinc-500">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Your Orders</h2>
                <Badge variant="outline" className="px-4 py-1">
                  {userData?.role === 'designer' ? 'Designer View' : 'Client View'}
                </Badge>
              </div>

              <div className="grid gap-4">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} role={userData?.role || 'client'} />
                ))}
                {orders.length === 0 && (
                  <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-dashed border-zinc-200">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-8 h-8 text-zinc-300" />
                    </div>
                    <h4 className="text-xl font-semibold">No orders yet</h4>
                    <p className="text-zinc-500">
                      {userData?.role === 'designer' 
                        ? "You haven't received any orders yet. Keep uploading designs!" 
                        : "You haven't placed any orders yet. Explore designs to get started."}
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab('explore')}>
                      Explore Designs
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">DH</div>
              DesignHub
            </h1>
            <p className="text-sm text-zinc-500">© 2026 DesignHub Inc. All rights reserved.</p>
          </div>
          <div className="flex gap-8 text-sm font-medium text-zinc-500">
            <a href="#" className="hover:text-zinc-900">Privacy</a>
            <a href="#" className="hover:text-zinc-900">Terms</a>
            <a href="#" className="hover:text-zinc-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sub-components

function DesignCard({ design, currentUser }: { design: Design, currentUser: FirebaseUser | null, key?: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-sm hover:shadow-xl transition-all"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-zinc-100">
        {design.mediaType === 'image' ? (
          <img 
            src={design.mediaUrl} 
            alt={design.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        ) : (
          <video 
            src={design.mediaUrl} 
            className="w-full h-full object-cover"
            muted 
            loop 
            onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
            onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
          />
        )}
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/90 text-zinc-900 backdrop-blur-sm border-none">
            ${design.price}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <OrderDesignDialog design={design} user={currentUser} />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold truncate pr-2">{design.title}</h4>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
            {design.mediaType}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5">
            <AvatarFallback className="text-[8px]">{design.designerName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-zinc-500 font-medium">{design.designerName}</span>
        </div>
      </div>
    </motion.div>
  );
}

function OrderCard({ order, role }: { order: Order, role: 'designer' | 'client', key?: string }) {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    accepted: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  const updateStatus = async (newStatus: Order['status']) => {
    try {
      await setDoc(doc(db, 'orders', order.id), { ...order, status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
    } catch (e) {
      toast.error('Failed to update order status');
    }
  };

  return (
    <Card className="rounded-2xl border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            Order #{order.id.slice(-6)}
            <Badge className={`${statusColors[order.status]} border px-2 py-0`}>
              {order.status}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Placed on {new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}
          </CardDescription>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">${order.price}</p>
        </div>
      </CardHeader>
      <CardContent className="py-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Requirements</p>
              <p className="text-sm text-zinc-700 italic">"{order.requirements}"</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-zinc-100 pt-4 flex justify-end gap-2">
        {role === 'designer' && order.status === 'pending' && (
          <>
            <Button size="sm" variant="outline" onClick={() => updateStatus('cancelled')}>Decline</Button>
            <Button size="sm" onClick={() => updateStatus('accepted')}>Accept Order</Button>
          </>
        )}
        {role === 'designer' && order.status === 'accepted' && (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus('completed')}>
            Mark as Completed
          </Button>
        )}
        {role === 'client' && order.status === 'pending' && (
          <Button size="sm" variant="outline" className="text-rose-600 hover:text-rose-700" onClick={() => updateStatus('cancelled')}>
            Cancel Order
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function UploadDesignDialog({ designer }: { designer: UserData }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [price, setPrice] = useState('49');
  const [tags, setTags] = useState('');

  const handleUpload = async () => {
    if (!title || !mediaUrl) return toast.error('Please fill in required fields');
    
    try {
      await addDoc(collection(db, 'designs'), {
        designerId: designer.uid,
        designerName: designer.displayName,
        title,
        description,
        mediaUrl,
        mediaType,
        price: parseFloat(price),
        tags: tags.split(',').map(t => t.trim()),
        createdAt: Timestamp.now()
      });
      toast.success('Design uploaded successfully!');
      setOpen(false);
      // Reset
      setTitle(''); setDescription(''); setMediaUrl(''); setPrice('49'); setTags('');
    } catch (e) {
      toast.error('Upload failed. Check permissions.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full">
          <Plus className="w-4 h-4 mr-2" /> Upload Design
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload New Design</DialogTitle>
          <DialogDescription>Share your creative work with the community.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g. Minimalist Brand Identity" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Media Type</label>
              <div className="flex gap-2">
                <Button 
                  variant={mediaType === 'image' ? 'default' : 'outline'} 
                  className="flex-1"
                  onClick={() => setMediaType('image')}
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> Image
                </Button>
                <Button 
                  variant={mediaType === 'video' ? 'default' : 'outline'} 
                  className="flex-1"
                  onClick={() => setMediaType('video')}
                >
                  <Video className="w-4 h-4 mr-2" /> Video
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Base Price ($)</label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Media URL *</label>
            <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://picsum.photos/seed/design/800/600" />
            <p className="text-[10px] text-zinc-500 italic">Use a direct link to your image or video file.</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us more about this design..." />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Tags (comma separated)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="branding, logo, minimal" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} className="bg-zinc-900 text-white">Publish Design</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrderDesignDialog({ design, user }: { design: Design, user: FirebaseUser | null }) {
  const [open, setOpen] = useState(false);
  const [requirements, setRequirements] = useState('');

  const handleOrder = async () => {
    if (!user) return toast.error('Please sign in to place an order');
    if (!requirements) return toast.error('Please specify your requirements');

    try {
      await addDoc(collection(db, 'orders'), {
        clientId: user.uid,
        designerId: design.designerId,
        designId: design.id,
        status: 'pending',
        requirements,
        price: design.price,
        createdAt: Timestamp.now()
      });
      toast.success('Order placed successfully! The designer will review it.');
      setOpen(false);
      setRequirements('');
    } catch (e) {
      toast.error('Failed to place order.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-zinc-900 hover:bg-zinc-100 rounded-full shadow-lg">
          Place Order
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order Design: {design.title}</DialogTitle>
          <DialogDescription>
            You are ordering a custom design based on this work from <strong>{design.designerName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="aspect-video rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
            <img src={design.mediaUrl} alt={design.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Requirements</label>
            <Textarea 
              value={requirements} 
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Describe what you need (e.g., 'I want a similar logo but with my company name: TechFlow')" 
              className="min-h-[120px]"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
            <span className="text-sm font-medium text-zinc-500">Total Price</span>
            <span className="text-2xl font-bold">${design.price}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleOrder} className="bg-zinc-900 text-white">Confirm Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

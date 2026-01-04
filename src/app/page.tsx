'use client';

import { useState, useEffect } from 'react';
import {
  Building2, CreditCard, PieChart, Users, Activity, Settings, ChevronDown,
  Plus, Download, Upload, Search, Calendar, LogOut, Menu, X, Eye, Trash2,
  Edit2, Filter, TrendingUp, DollarSign, BarChart3, Zap, ShieldCheck, Map as MapIcon,
  MessageCircle, Send, Brain, Maximize2, Minimize2, Move
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type AccessLevel = 1 | 2 | 3;
type Currency = 'USD' | 'EUR' | 'RSD';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  bankAccount: string;
  contactPerson?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  deleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

interface Hotel {
  id: string;
  name: string;
  city: string;
  rooms: number;
  phone: string;
  manager: string;
  country: string;
  supplierId?: string;
  contactPerson?: string;
  latitude?: number;
  longitude?: number;
  deleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

interface Payment {
  id: string;
  supplierId: string;
  hotelId: string;
  amount: number;
  currency: Currency;
  date: string;
  description: string;
  status: 'pending' | 'completed';
  dueDate?: string;
  documentType?: string;
  documentNumber?: string;
  method: string;
  bankName?: string;
  serviceType?: string;
  realizationYear?: number;
  reservations?: string[];
  deleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: AccessLevel;
  lastLogin: string;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string | Date | number;
  user: string;
  details: string;
}

const themes = ['github-dark', 'github-dark-dimmed', 'github-dark-blue', 'github-light'];
const roleNames: Record<AccessLevel, string> = { 1: 'Admin', 2: 'Editor', 3: 'Viewer' };

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [storageReady, setStorageReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTheme, setCurrentTheme] = useState('github-dark');
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'suppliers' | 'hotels' | 'users' | 'settings'>('overview');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analyticsFromDate, setAnalyticsFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [analyticsToDate, setAnalyticsToDate] = useState(new Date().toISOString().split('T')[0]);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(500);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(500);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [activeSummaryView, setActiveSummaryView] = useState<'suppliers' | 'hotels' | 'countries' | null>(null);
  const [importTarget, setImportTarget] = useState<'suppliers' | 'hotels'>('suppliers');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [settingsView, setSettingsView] = useState<'general' | 'logs' | 'deleted' | 'ai-training'>('general');
  const [showDeletedItems, setShowDeletedItems] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [logsLimit, setLogsLimit] = useState(50);
  const [logsFromDate, setLogsFromDate] = useState('');
  const [logsToDate, setLogsToDate] = useState('');
  const [logsSearchQuery, setLogsSearchQuery] = useState('');

  // AI Assistant States
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<{role: 'user' | 'ai', message: string}[]>([]);
  const [aiInputMessage, setAiInputMessage] = useState('');
  const [aiChatWidth, setAiChatWidth] = useState(400);
  const [aiChatHeight, setAiChatHeight] = useState(500);
  const [aiChatX, setAiChatX] = useState(0);
  const [aiChatY, setAiChatY] = useState(0);
  const [isAiResizing, setIsAiResizing] = useState(false);
  const [isAiDragging, setIsAiDragging] = useState(false);
  const [aiResizeDirection, setAiResizeDirection] = useState<string>('');
  const [aiDragStart, setAiDragStart] = useState({x: 0, y: 0});
  const [aiTrainingData, setAiTrainingData] = useState<{question: string, answer: string}[]>([]);
  const [aiTrainingQuestion, setAiTrainingQuestion] = useState('');
  const [aiTrainingAnswer, setAiTrainingAnswer] = useState('');
  const [aiIsLoading, setAiIsLoading] = useState(false);

  // Initialize AI chat position on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAiChatX(window.innerWidth - 450);
      setAiChatY(window.innerHeight - 550);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'overview') {
      setActiveSummaryView(null);
    }
  }, [activeTab]);

  // Payment form
  const [paymentForm, setPaymentForm] = useState<Partial<Payment>>({
    supplierId: '',
    hotelId: '',
    amount: 0,
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'pending',
    dueDate: '',
    documentType: 'Profaktura',
    documentNumber: '',
    method: 'Bankarska transakcija',
    bankName: '',
    serviceType: '',
    realizationYear: new Date().getFullYear(),
    reservations: [],
  });
  const [reservationInput, setReservationInput] = useState('');

  // Supplier form
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    bankAccount: '',
    contactPerson: '',
    latitude: undefined,
    longitude: undefined,
    country: '',
  });
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [supplierGeoData, setSupplierGeoData] = useState<{lat: number, lng: number, address: string, country: string} | null>(null);

  // Hotel form
  const [hotelForm, setHotelForm] = useState<Partial<Hotel>>({
    name: '',
    city: '',
    rooms: 0,
    phone: '',
    manager: '',
    country: '',
    supplierId: '',
    contactPerson: '',
    latitude: undefined,
    longitude: undefined,
  });
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');
  const [geoLocationData, setGeoLocationData] = useState<{lat: number, lng: number, address: string, country: string} | null>(null);

  // User form
  const [userForm, setUserForm] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    role: 3,
  });

  const fetchData = async () => {
    try {
      const showDelQuery = showDeletedItems ? '?showDeleted=true' : '';
      const [suppliersRes, hotelsRes, paymentsRes, logsRes, usersRes] = await Promise.all([
        fetch(`/api/suppliers${showDelQuery}`),
        fetch(`/api/hotels${showDelQuery}`),
        fetch(`/api/payments${showDelQuery}`),
        fetch('/api/activity-logs'),
        fetch('/api/users')
      ]);

      const suppliersData = await suppliersRes.json();
      const hotelsData = await hotelsRes.json();
      const paymentsData = await paymentsRes.json();
      const logsData = await logsRes.json();
      const usersData = await usersRes.json();

      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setHotels(Array.isArray(hotelsData) ? hotelsData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setActivityLogs(Array.isArray(logsData) ? logsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setStorageReady(true);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const showDelQuery = showDeletedItems ? '?showDeleted=true' : '';
      const res = await fetch(`/api/suppliers${showDelQuery}`);
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchHotels = async () => {
    try {
      const showDelQuery = showDeletedItems ? '?showDeleted=true' : '';
      const res = await fetch(`/api/hotels${showDelQuery}`);
      const data = await res.json();
      setHotels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const showDelQuery = showDeletedItems ? '?showDeleted=true' : '';
      const res = await fetch(`/api/payments${showDelQuery}`);
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'github-dark';
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
    }

    // Load AI training data from localStorage
    const savedAiData = localStorage.getItem('isplateData');
    if (savedAiData) {
      const data = JSON.parse(savedAiData);
      if (data.aiTrainingData && Array.isArray(data.aiTrainingData)) {
        setAiTrainingData(data.aiTrainingData);
      }
    }

    fetchData();
  }, []);

  // Osvježi podatke kada se promeni showDeletedItems
  useEffect(() => {
    if (isLoggedIn && storageReady) {
      fetchData();
    }
  }, [showDeletedItems]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      // In a real app, this would be a POST to /api/login
      // For now, we check against the users we fetched
      const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
      
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
        logActivity('Prijava na sistem', user.name);
      } else {
        setLoginError('Neispravan email ili lozinka');
      }
    } catch (error) {
      setLoginError('Greška pri prijavi');
    }
  };

  const handleLogout = () => {
    if (currentUser) logActivity('Odjava sa sistema', currentUser.name);
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.max(250, Math.min(650, e.clientX));
        setLeftSidebarWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(325, Math.min(800, window.innerWidth - e.clientX));
        setRightSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      setIsAiResizing(false);
      setIsAiDragging(false);
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingLeft, isResizingRight]);

  // AI Chat Drag and Resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isAiDragging) {
        const newX = e.clientX - aiDragStart.x;
        const newY = e.clientY - aiDragStart.y;
        setAiChatX(Math.max(0, Math.min(newX, window.innerWidth - aiChatWidth)));
        setAiChatY(Math.max(0, Math.min(newY, window.innerHeight - aiChatHeight)));
      }

      if (isAiResizing) {
        const deltaX = e.movementX;
        const deltaY = e.movementY;

        if (aiResizeDirection.includes('e')) {
          setAiChatWidth(prev => Math.max(350, Math.min(prev + deltaX, window.innerWidth - aiChatX)));
        }
        if (aiResizeDirection.includes('w')) {
          const newWidth = aiChatWidth - deltaX;
          if (newWidth >= 350) {
            setAiChatWidth(newWidth);
            setAiChatX(prev => prev + deltaX);
          }
        }
        if (aiResizeDirection.includes('s')) {
          setAiChatHeight(prev => Math.max(400, Math.min(prev + deltaY, window.innerHeight - aiChatY)));
        }
        if (aiResizeDirection.includes('n')) {
          const newHeight = aiChatHeight - deltaY;
          if (newHeight >= 400) {
            setAiChatHeight(newHeight);
            setAiChatY(prev => prev + deltaY);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsAiResizing(false);
      setIsAiDragging(false);
    };

    if (isAiDragging || isAiResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isAiDragging, isAiResizing, aiResizeDirection, aiDragStart, aiChatWidth, aiChatHeight, aiChatX, aiChatY]);

  const saveToStorage = (key: string, value: unknown) => {
    const data = JSON.parse(localStorage.getItem('isplateData') || '{}');
    data[key] = value;
    localStorage.setItem('isplateData', JSON.stringify(data));
  };

  const logActivity = async (action: string, details: string) => {
    if (!currentUser) return;
    const log = {
      id: `log-${Date.now()}`,
      action,
      user: currentUser.name,
      details,
    };

    try {
      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      
      const updatedLogs = await (await fetch('/api/activity-logs')).json();
      setActivityLogs(Array.isArray(updatedLogs) ? updatedLogs : []);
    } catch (error) {
      console.error('Error logging activity:', error);
      // Fallback to local state if API fails
      const localLog: ActivityLog = {
        ...log,
        timestamp: new Date().toISOString(),
      };
      const newLogs = [localLog, ...activityLogs].slice(0, 50);
      setActivityLogs(newLogs);
    }
  };

  const addSupplier = async () => {
    if (!supplierForm.name) return;
    const supplierData = {
      id: editingId || `sup-${Date.now()}`,
      name: supplierForm.name || '',
      email: supplierForm.email || '',
      phone: supplierForm.phone || '',
      address: supplierForm.address || '',
      bankAccount: supplierForm.bankAccount || '',
      latitude: supplierForm.latitude,
      longitude: supplierForm.longitude,
      country: supplierForm.country || '',
    };

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/suppliers' + (editingId ? `?id=${editingId}` : '');
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
      });

      if (response.ok) {
        const updatedSuppliers = await (await fetch('/api/suppliers')).json();
        setSuppliers(Array.isArray(updatedSuppliers) ? updatedSuppliers : []);
        logActivity(editingId ? 'Izmenio dobavljača' : 'Dodao dobavljača', supplierForm.name);
        setSupplierForm({ name: '', email: '', phone: '', address: '', bankAccount: '', latitude: undefined, longitude: undefined, country: '' });
        setEditingId(null);
        setSupplierGeoData(null);
      } else {
        const errorData = await response.json();
        alert(`Greška pri čuvanju: ${errorData.error || 'Nepoznata greška'}`);
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Greška pri povezivanju sa serverom.');
    }
  };

  const addHotel = async () => {
    if (!hotelForm.name) return;
    const hotelData = {
      id: editingId || `hot-${Date.now()}`,
      name: hotelForm.name || '',
      city: hotelForm.city || '',
      rooms: hotelForm.rooms || 0,
      phone: hotelForm.phone || '',
      manager: hotelForm.manager || '',
      country: hotelForm.country || '',
      supplierId: hotelForm.supplierId || '',
      contactPerson: hotelForm.contactPerson || '',
      latitude: hotelForm.latitude,
      longitude: hotelForm.longitude,
    };

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/hotels' + (editingId ? `?id=${editingId}` : '');
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hotelData),
      });

      if (response.ok) {
        const updatedHotels = await (await fetch('/api/hotels')).json();
        setHotels(Array.isArray(updatedHotels) ? updatedHotels : []);
        logActivity(editingId ? 'Izmenio hotel' : 'Dodao hotel', hotelForm.name);
        setHotelForm({ name: '', city: '', rooms: 0, phone: '', manager: '', country: '', supplierId: '', contactPerson: '', latitude: undefined, longitude: undefined });
        setEditingId(null);
        setGeoLocationData(null);
      } else {
        const errorData = await response.json();
        alert(`Greška pri čuvanju: ${errorData.error || 'Nepoznata greška'}`);
      }
    } catch (error) {
      console.error('Error saving hotel:', error);
      alert('Greška pri povezivanju sa serverom.');
    }
  };

  const addUser = async () => {
    if (!userForm.name || !userForm.email) return;
    const userData = {
      id: editingId || `usr-${Date.now()}`,
      name: userForm.name || '',
      email: userForm.email || '',
      password: userForm.password || '',
      role: userForm.role || 3,
    };

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/users' + (editingId ? `?id=${editingId}` : '');
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const updatedUsers = await (await fetch('/api/users')).json();
        setUsers(Array.isArray(updatedUsers) ? updatedUsers : []);
        logActivity(editingId ? 'Izmenio korisnika' : 'Dodao korisnika', userForm.name);
        setUserForm({ name: '', email: '', password: '', role: 3 });
        setEditingId(null);
      } else {
        const errorData = await response.json();
        alert(`Greška pri čuvanju: ${errorData.error || 'Nepoznata greška'}`);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Greška pri povezivanju sa serverom.');
    }
  };

  const addPayment = async () => {
    if (!paymentForm.supplierId || !paymentForm.amount) return;
    const paymentData = {
      id: editingId || `pay-${Date.now()}`,
      supplierId: paymentForm.supplierId || '',
      hotelId: paymentForm.hotelId || '',
      amount: paymentForm.amount || 0,
      currency: paymentForm.currency || 'EUR',
      date: paymentForm.date || new Date().toISOString().split('T')[0],
      description: paymentForm.description || '',
      status: paymentForm.status || 'pending',
      dueDate: paymentForm.dueDate || '',
      documentType: paymentForm.documentType || 'Profaktura',
      documentNumber: paymentForm.documentNumber || '',
      method: paymentForm.method || 'Bankarska transakcija',
      bankName: paymentForm.bankName || '',
      serviceType: paymentForm.serviceType || '',
      realizationYear: paymentForm.realizationYear || new Date().getFullYear(),
      reservations: paymentForm.reservations || [],
    };

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/payments' + (editingId ? `?id=${editingId}` : '');
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        const updatedPayments = await (await fetch('/api/payments')).json();
        setPayments(Array.isArray(updatedPayments) ? updatedPayments : []);
        logActivity(editingId ? 'Izmenio isplatu' : 'Nova isplata', `${paymentData.amount} ${paymentData.currency}`);
        setPaymentForm({
          supplierId: '',
          hotelId: '',
          amount: 0,
          currency: 'EUR',
          date: new Date().toISOString().split('T')[0],
          description: '',
          status: 'pending',
          dueDate: '',
          documentType: 'Profaktura',
          documentNumber: '',
          method: 'Bankarska transakcija',
          bankName: '',
          serviceType: '',
          realizationYear: new Date().getFullYear(),
          reservations: [],
        });
        setEditingId(null);
        setShowPaymentForm(false);
      } else {
        const errorData = await response.json();
        alert(`Greška pri čuvanju: ${errorData.error || 'Nepoznata greška'}`);
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Greška pri povezivanju sa serverom.');
    }
  };

  const deleteItem = async (type: string, id: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu stavku?')) return;
    
    try {
      const url = `/api/${type === 'supplier' ? 'suppliers' : type === 'hotel' ? 'hotels' : type === 'user' ? 'users' : 'payments'}`;
      const response = await fetch(url, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          user: currentUser?.name || 'Unknown',
          hardDelete: false // Soft delete
        })
      });

      if (response.ok) {
        // Osvježi podatke
        if (type === 'supplier') {
          fetchSuppliers();
        } else if (type === 'hotel') {
          fetchHotels();
        } else if (type === 'payment') {
          fetchPayments();
        } else if (type === 'user') {
          fetchUsers();
        }
        logActivity(`Obrisao ${type}`, id);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const restoreItem = async (type: string, id: string) => {
    try {
      const url = `/api/${type === 'supplier' ? 'suppliers' : type === 'hotel' ? 'hotels' : 'payments'}`;
      const response = await fetch(url, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        // Osvježi podatke
        if (type === 'supplier') {
          fetchSuppliers();
        } else if (type === 'hotel') {
          fetchHotels();
        } else if (type === 'payment') {
          fetchPayments();
        }
        logActivity(`Vratio ${type}`, id);
        alert('Stavka je uspješno vraćena!');
      }
    } catch (error) {
      console.error('Error restoring item:', error);
    }
  };

  const hardDeleteItem = async (type: string, id: string) => {
    if (!confirm('UPOZORENJE: Ovo će TRAJNO obrisati stavku! Da li ste apsolutno sigurni?')) return;
    
    try {
      const url = `/api/${type === 'supplier' ? 'suppliers' : type === 'hotel' ? 'hotels' : 'payments'}`;
      const response = await fetch(url, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          user: currentUser?.name || 'Unknown',
          hardDelete: true // Trajno brisanje
        })
      });

      if (response.ok) {
        // Osvježi podatke
        if (type === 'supplier') {
          fetchSuppliers();
        } else if (type === 'hotel') {
          fetchHotels();
        } else if (type === 'payment') {
          fetchPayments();
        }
        logActivity(`TRAJNO OBRISAO ${type}`, id);
        alert('Stavka je trajno obrisana!');
      }
    } catch (error) {
      console.error('Error hard deleting item:', error);
    }
  };

  const editItem = (type: string, id: string) => {
    setEditingId(id);
    if (type === 'supplier') {
      const supplier = suppliers.find(s => s.id === id);
      if (supplier) setSupplierForm(supplier);
    } else if (type === 'hotel') {
      const hotel = hotels.find(h => h.id === id);
      if (hotel) setHotelForm(hotel);
    } else if (type === 'payment') {
      const payment = payments.find(p => p.id === id);
      if (payment) {
        setPaymentForm(payment);
        setShowPaymentForm(true);
      }
    } else if (type === 'user') {
      const user = users.find(u => u.id === id);
      if (user) setUserForm(user);
    }
  };

  const exportToJSON = () => {
    const data = { suppliers, hotels, payments, users, activityLogs };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isplate-${Date.now()}.json`;
    a.click();
    logActivity('Izvozio podatke', 'JSON');
  };

  const exportToExcel = () => {
    const exportData = (Array.isArray(payments) ? payments : []).map(p => ({
      Dobavljač: suppliers.find(s => s.id === p.supplierId)?.name || 'N/A',
      Hotel: hotels.find(h => h.id === p.hotelId)?.name || 'N/A',
      Usluga: p.serviceType || 'N/A',
      Iznos: p.amount,
      Valuta: p.currency,
      Datum: p.date,
      Metoda: p.method,
      Banka: p.bankName || '',
      Status: p.status,
      Opis: p.description,
      Rezervacije: Array.isArray(p.reservations) ? p.reservations.join(', ') : ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Isplate');
    XLSX.writeFile(wb, `isplate-${Date.now()}.xlsx`);
    logActivity('Izvozio podatke', 'Excel');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Izveštaj o isplatama', 10, 10);
    autoTable(doc, {
      head: [['Dobavljač', 'Hotel', 'Usluga', 'Iznos', 'Datum', 'Metoda', 'Status']],
      body: (Array.isArray(payments) ? payments : []).map(p => [
        (Array.isArray(suppliers) ? suppliers : []).find(s => s.id === p.supplierId)?.name || 'N/A',
        (Array.isArray(hotels) ? hotels : []).find(h => h.id === p.hotelId)?.name || 'N/A',
        p.serviceType || 'N/A',
        `${p.amount} ${p.currency}`,
        p.date,
        p.bankName ? `${p.method} (${p.bankName})` : p.method,
        p.status,
      ]),
      startY: 20,
    });
    doc.save(`isplate-${Date.now()}.pdf`);
    logActivity('Izvozio podatke', 'PDF');
  };

  const exportToXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<payments>\n';
    payments.forEach(p => {
      xml += '  <payment>\n';
      xml += `    <id>${p.id}</id>\n`;
      xml += `    <supplier>${suppliers.find(s => s.id === p.supplierId)?.name || 'N/A'}</supplier>\n`;
      xml += `    <hotel>${hotels.find(h => h.id === p.hotelId)?.name || 'N/A'}</hotel>\n`;
      xml += `    <serviceType>${p.serviceType || 'N/A'}</serviceType>\n`;
      xml += `    <amount>${p.amount}</amount>\n`;
      xml += `    <currency>${p.currency}</currency>\n`;
      xml += `    <date>${p.date}</date>\n`;
      xml += `    <method>${p.method}</method>\n`;
      xml += `    <status>${p.status}</status>\n`;
      xml += `    <description>${p.description}</description>\n`;
      xml += '  </payment>\n';
    });
    xml += '</payments>';
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isplate-${Date.now()}.xml`;
    a.click();
    logActivity('Izvozio podatke', 'XML');
  };

  const exportToHTML = () => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Izveštaj o isplatama</title>
        <style>
          table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f4f4f4; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>Izveštaj o isplatama</h1>
        <table>
          <thead>
            <tr>
              <th>Dobavljač</th>
              <th>Hotel</th>
              <th>Usluga</th>
              <th>Iznos</th>
              <th>Datum</th>
              <th>Metoda</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;
    payments.forEach(p => {
      html += `
        <tr>
          <td>${suppliers.find(s => s.id === p.supplierId)?.name || 'N/A'}</td>
          <td>${hotels.find(h => h.id === p.hotelId)?.name || 'N/A'}</td>
          <td>${p.serviceType || 'N/A'}</td>
          <td>${p.amount} ${p.currency}</td>
          <td>${p.date}</td>
          <td>${p.method}</td>
          <td>${p.status}</td>
        </tr>
      `;
    });
    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isplate-${Date.now()}.html`;
    a.click();
    logActivity('Izvozio podatke', 'HTML');
  };

  const handleImport = async (file: File) => {
    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    reader.onload = async (e) => {
      const content = e.target?.result;
      let data: any[] = [];

      try {
        if (extension === 'json') {
          const parsed = JSON.parse(content as string);
          data = Array.isArray(parsed) ? parsed : (parsed.data || []);
        } else if (extension === 'xlsx' || extension === 'xls') {
          const workbook = XLSX.read(content, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else if (extension === 'xml') {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content as string, "text/xml");
          const items = xmlDoc.getElementsByTagName("item");
          if (items.length === 0) {
            // Try alternative structure
            const payments = xmlDoc.getElementsByTagName("payment");
            for (let i = 0; i < payments.length; i++) {
              const obj: any = {};
              for (let j = 0; j < payments[i].childNodes.length; j++) {
                const node = payments[i].childNodes[j];
                if (node.nodeType === 1) obj[node.nodeName] = node.textContent;
              }
              data.push(obj);
            }
          } else {
            for (let i = 0; i < items.length; i++) {
              const obj: any = {};
              for (let j = 0; j < items[i].childNodes.length; j++) {
                const node = items[i].childNodes[j];
                if (node.nodeType === 1) obj[node.nodeName] = node.textContent;
              }
              data.push(obj);
            }
          }
        } else if (extension === 'pdf' || extension === 'html' || extension === 'htm') {
          alert(`Import iz ${extension.toUpperCase()} formata još nije implementiran. Molimo koristite JSON, Excel ili XML.`);
          return;
        }

        if (data.length === 0) {
          alert('Nema podataka za uvoz ili format nije podržan.');
          return;
        }

        if (importTarget === 'suppliers') {
          for (const item of data) {
            const newSupplier: Supplier = {
              id: item.id || Date.now().toString() + Math.random(),
              name: item.name || item.Naziv || '',
              email: item.email || item.Email || '',
              phone: item.phone || item.Telefon || '',
              address: item.address || item.Adresa || '',
              bankAccount: item.bankAccount || item.ZiroRacun || '',
              country: item.country || item.Drzava || ''
            };
            await fetch('/api/suppliers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newSupplier),
            });
          }
          fetchData();
        } else {
          for (const item of data) {
            const newHotel: Hotel = {
              id: item.id || Date.now().toString() + Math.random(),
              name: item.name || item.Naziv || '',
              city: item.city || item.Grad || '',
              rooms: Number(item.rooms || item.Sobe || 0),
              phone: item.phone || item.Telefon || '',
              manager: item.manager || item.Menadzer || '',
              country: item.country || item.Drzava || ''
            };
            await fetch('/api/hotels', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newHotel),
            });
          }
          fetchData();
        }
        logActivity(`Uvezao podatke u ${importTarget}`, `${data.length} stavki`);
        alert(`Uspešno uvezeno ${data.length} stavki u bazu ${importTarget === 'suppliers' ? 'dobavljača' : 'hotela'}.`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Greška pri uvozu podataka.');
      }
    };

    if (extension === 'xlsx' || extension === 'xls') {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
        if (Array.isArray(data.hotels)) setHotels(data.hotels);
        if (Array.isArray(data.payments)) setPayments(data.payments);
        if (Array.isArray(data.users)) setUsers(data.users);
        saveToStorage('isplateData', data);
        logActivity('Učitao podatke', 'JSON');
      } catch (error) {
        alert('Greška pri učitavanju JSON fajla');
      }
    };
    reader.readAsText(file);
  };

  // AI Assistant Functions
  const processAiQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // Check training data first
    const trainingMatch = aiTrainingData.find(item => 
      item.question.toLowerCase().includes(lowerQuery) || lowerQuery.includes(item.question.toLowerCase())
    );
    if (trainingMatch) return trainingMatch.answer;

    // Payments queries
    if (lowerQuery.includes('ukupno') || lowerQuery.includes('total') || lowerQuery.includes('suma')) {
      if (lowerQuery.includes('isplat')) {
        const total = payments.reduce((sum, p) => sum + p.amount, 0);
        return `Ukupan iznos svih isplata je: ${formatCurrency(total, 'EUR')} (${payments.length} isplata)`;
      }
    }

    if (lowerQuery.includes('na čekanju') || lowerQuery.includes('pending')) {
      const pending = payments.filter(p => p.status === 'pending');
      const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
      return `Trenutno ima ${pending.length} isplata na čekanju, ukupno ${formatCurrency(totalPending, 'EUR')}`;
    }

    if (lowerQuery.includes('isplaćeno') || lowerQuery.includes('completed')) {
      const completed = payments.filter(p => p.status === 'completed');
      const totalCompleted = completed.reduce((sum, p) => sum + p.amount, 0);
      return `Ukupno isplaćeno: ${completed.length} isplata, ${formatCurrency(totalCompleted, 'EUR')}`;
    }

    // Supplier queries
    if (lowerQuery.includes('dobavljač') || lowerQuery.includes('supplier')) {
      if (lowerQuery.includes('broj') || lowerQuery.includes('koliko')) {
        return `Trenutno imate ${suppliers.filter(s => !s.deleted).length} aktivnih dobavljača`;
      }
      const supplierName = suppliers.find(s => lowerQuery.includes(s.name.toLowerCase()));
      if (supplierName) {
        const supplierPayments = payments.filter(p => p.supplierId === supplierName.id);
        const total = supplierPayments.reduce((sum, p) => sum + p.amount, 0);
        return `Dobavljač ${supplierName.name}: ${supplierPayments.length} isplata, ukupno ${formatCurrency(total, 'EUR')}`;
      }
    }

    // Hotel queries
    if (lowerQuery.includes('hotel')) {
      if (lowerQuery.includes('broj') || lowerQuery.includes('koliko')) {
        return `Trenutno imate ${hotels.filter(h => !h.deleted).length} aktivnih hotela`;
      }
      const hotelName = hotels.find(h => lowerQuery.includes(h.name.toLowerCase()));
      if (hotelName) {
        const hotelPayments = payments.filter(p => p.hotelId === hotelName.id);
        const total = hotelPayments.reduce((sum, p) => sum + p.amount, 0);
        return `Hotel ${hotelName.name}: ${hotelPayments.length} isplata, ukupno ${formatCurrency(total, 'EUR')}`;
      }
    }

    // Date range queries
    if (lowerQuery.includes('danas')) {
      const today = new Date().toISOString().split('T')[0];
      const todayPayments = payments.filter(p => p.date === today);
      return `Danas: ${todayPayments.length} isplata, ukupno ${formatCurrency(todayPayments.reduce((s,p) => s + p.amount, 0), 'EUR')}`;
    }

    if (lowerQuery.includes('ovog meseca') || lowerQuery.includes('ovaj mesec')) {
      const thisMonth = new Date().toISOString().slice(0, 7);
      const monthPayments = payments.filter(p => p.date.startsWith(thisMonth));
      return `Ovog meseca: ${monthPayments.length} isplata, ukupno ${formatCurrency(monthPayments.reduce((s,p) => s + p.amount, 0), 'EUR')}`;
    }

    // Currency queries
    if (lowerQuery.includes('valut')) {
      const eur = payments.filter(p => p.currency === 'EUR').reduce((s,p) => s + p.amount, 0);
      const usd = payments.filter(p => p.currency === 'USD').reduce((s,p) => s + p.amount, 0);
      const rsd = payments.filter(p => p.currency === 'RSD').reduce((s,p) => s + p.amount, 0);
      return `Isplate po valutama:\nEUR: ${formatCurrency(eur, 'EUR')}\nUSD: ${formatCurrency(usd, 'USD')}\nRSD: ${formatCurrency(rsd, 'RSD')}`;
    }

    return 'Nisam siguran kako da odgovorim na to pitanje. Možete me obučiti u podešavanjima (AI Obuka tab) ili pokušajte pitati o:\n- Ukupnim isplatama\n- Statusima (na čekanju/isplaćeno)\n- Konkretnim dobavljačima ili hotelima\n- Datumima (danas, ovog meseca)\n- Valutama';
  };

  const handleAiSend = async () => {
    if (!aiInputMessage.trim() || aiIsLoading) return;
    
    const userMessage = aiInputMessage;
    setAiChatMessages([...aiChatMessages, { role: 'user', message: userMessage }]);
    setAiInputMessage('');
    setAiIsLoading(true);

    try {
      // Prepare context with current data
      const context = `
ISPLATE:
- Ukupno isplata: ${payments.length}
- Na čekanju: ${payments.filter(p => p.status === 'pending').length}
- Isplaćeno: ${payments.filter(p => p.status === 'completed').length}
- Ukupan iznos: ${formatCurrency(payments.reduce((s,p) => s + p.amount, 0), 'EUR')}
- EUR: ${formatCurrency(payments.filter(p => p.currency === 'EUR').reduce((s,p) => s + p.amount, 0), 'EUR')}
- USD: ${formatCurrency(payments.filter(p => p.currency === 'USD').reduce((s,p) => s + p.amount, 0), 'USD')}
- RSD: ${formatCurrency(payments.filter(p => p.currency === 'RSD').reduce((s,p) => s + p.amount, 0), 'RSD')}

DOBAVLJAČI:
- Broj dobavljača: ${suppliers.filter(s => !s.deleted).length}
- Top 3: ${suppliers.slice(0, 3).map(s => s.name).join(', ')}

HOTELI:
- Broj hotela: ${hotels.filter(h => !h.deleted).length}
- Top 3: ${hotels.slice(0, 3).map(h => h.name).join(', ')}

OBUČENI PODACI:
${aiTrainingData.map(t => `Q: ${t.question}\nA: ${t.answer}`).join('\n\n')}
`;

      // Call Gemini API
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, context }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('AI API Error:', data);
        throw new Error(data.error || 'AI API request failed');
      }

      if (data.answer) {
        setAiChatMessages(prev => [...prev, { role: 'ai', message: data.answer }]);
        logActivity('AI Chat', `Pitanje: ${userMessage.substring(0, 50)}...`);
      } else {
        throw new Error('No answer received from AI');
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      const errorMsg = error?.message?.includes('API ključem') 
        ? 'Problem sa API ključem. Kontaktirajte administratora.'
        : error?.message?.includes('limit')
        ? 'Prekoračen limit poziva. Pokušajte kasnije.'
        : error?.message?.includes('internet') || error?.message?.includes('network')
        ? 'Problem sa konekcijom. Proverite internet vezu.'
        : 'Došlo je do greške pri komunikaciji sa AI-jem. Molim pokušajte ponovo.';
      
      setAiChatMessages(prev => [...prev, { 
        role: 'ai', 
        message: errorMsg
      }]);
    } finally {
      setAiIsLoading(false);
    }
  };

  const exportAiTrainingData = (format: 'json' | 'xlsx' | 'xml' | 'pdf' | 'html') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(aiTrainingData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-training-${Date.now()}.json`;
      a.click();
    } else if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(aiTrainingData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'AI Training');
      XLSX.writeFile(wb, `ai-training-${Date.now()}.xlsx`);
    } else if (format === 'xml') {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<training>\n';
      aiTrainingData.forEach(item => {
        xml += '  <item>\n';
        xml += `    <question>${item.question}</question>\n`;
        xml += `    <answer>${item.answer}</answer>\n`;
        xml += '  </item>\n';
      });
      xml += '</training>';
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-training-${Date.now()}.xml`;
      a.click();
    } else {
      alert(`Export u ${format.toUpperCase()} format još nije implementiran.`);
    }
    logActivity('Izvozio AI trening podatke', format.toUpperCase());
  };

  const importAiTrainingData = (file: File) => {
    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        let data: any[] = [];

        if (extension === 'json') {
          data = JSON.parse(content as string);
        } else if (extension === 'xlsx' || extension === 'xls') {
          const workbook = XLSX.read(content, { type: 'binary' });
          data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        } else if (extension === 'xml') {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content as string, 'text/xml');
          const items = xmlDoc.getElementsByTagName('item');
          for (let i = 0; i < items.length; i++) {
            data.push({
              question: items[i].getElementsByTagName('question')[0]?.textContent || '',
              answer: items[i].getElementsByTagName('answer')[0]?.textContent || ''
            });
          }
        }

        setAiTrainingData(data);
        saveToStorage('aiTrainingData', data);
        logActivity('Uvezao AI trening podatke', `${data.length} stavki`);
        alert(`Uspešno uvezeno ${data.length} trening podataka`);
      } catch (error) {
        alert('Greška pri uvozu AI trening podataka');
      }
    };

    if (extension === 'xlsx' || extension === 'xls') {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Analitika po datumskom opsegu
  const getAnalyticsByDateRange = () => {
    if (!Array.isArray(payments)) return { supplierStats: [], hotelStats: [], countryList: [], filteredPayments: [] };

    const filteredPayments = payments.filter(p => 
      p.status === 'completed' && 
      p.date >= analyticsFromDate && 
      p.date <= analyticsToDate
    );

    // Po dobavljačima
    const supplierStats = suppliers.map(supplier => {
      const supplierPayments = filteredPayments.filter(p => p.supplierId === supplier.id);
      return {
        name: supplier.name,
        count: supplierPayments.length,
        total: supplierPayments.reduce((sum, p) => sum + p.amount, 0),
      };
    }).filter(s => s.count > 0).sort((a, b) => b.total - a.total);

    // Po hotelima
    const hotelStats = hotels.map(hotel => {
      const hotelPayments = filteredPayments.filter(p => p.hotelId === hotel.id);
      return {
        name: hotel.name,
        country: hotel.country || 'N/A',
        count: hotelPayments.length,
        total: hotelPayments.reduce((sum, p) => sum + p.amount, 0),
      };
    }).filter(h => h.count > 0).sort((a, b) => b.total - a.total);

    // Po državama
    const countryStats: Record<string, { count: number; total: number }> = {};
    filteredPayments.forEach(payment => {
      const hotel = hotels.find(h => h.id === payment.hotelId);
      const country = hotel?.country || 'Neznano';
      if (!countryStats[country]) {
        countryStats[country] = { count: 0, total: 0 };
      }
      countryStats[country].count++;
      countryStats[country].total += payment.amount;
    });

    const countryList = Object.entries(countryStats)
      .map(([country, stats]) => ({ country, ...stats }))
      .sort((a, b) => b.total - a.total);

    return { supplierStats, hotelStats, countryList, filteredPayments };
  };

  const filteredPayments = Array.isArray(payments) ? payments.filter(p => {
    const matchesSearch = 
      suppliers.find(s => s.id === p.supplierId)?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotels.find(h => h.id === p.hotelId)?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.bankName && p.bankName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const paymentDate = new Date(p.date);
    const fromDate = new Date(analyticsFromDate);
    const toDate = new Date(analyticsToDate);
    
    // Set hours to 0 to compare only dates
    paymentDate.setHours(0, 0, 0, 0);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);

    const matchesDate = paymentDate >= fromDate && paymentDate <= toDate;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    return matchesSearch && matchesDate && matchesStatus;
  }) : [];

  const stats = {
    totalSuppliers: Array.isArray(suppliers) ? suppliers.length : 0,
    totalHotels: Array.isArray(hotels) ? hotels.length : 0,
    totalPayments: filteredPayments.length,
    totalUSD: filteredPayments.filter(p => p.currency === 'USD').reduce((sum, p) => sum + p.amount, 0),
    totalEUR: filteredPayments.filter(p => p.currency === 'EUR').reduce((sum, p) => sum + p.amount, 0),
    totalRSD: filteredPayments.filter(p => p.currency === 'RSD').reduce((sum, p) => sum + p.amount, 0),
    totalRawAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
    completedPayments: filteredPayments.filter(p => p.status === 'completed').length,
    pendingPayments: filteredPayments.filter(p => p.status === 'pending').length,
    // Statistika po statusima i valutama
    pendingUSD: filteredPayments.filter(p => p.status === 'pending' && p.currency === 'USD').reduce((sum, p) => sum + p.amount, 0),
    pendingEUR: filteredPayments.filter(p => p.status === 'pending' && p.currency === 'EUR').reduce((sum, p) => sum + p.amount, 0),
    pendingRSD: filteredPayments.filter(p => p.status === 'pending' && p.currency === 'RSD').reduce((sum, p) => sum + p.amount, 0),
    completedUSD: filteredPayments.filter(p => p.status === 'completed' && p.currency === 'USD').reduce((sum, p) => sum + p.amount, 0),
    completedEUR: filteredPayments.filter(p => p.status === 'completed' && p.currency === 'EUR').reduce((sum, p) => sum + p.amount, 0),
    completedRSD: filteredPayments.filter(p => p.status === 'completed' && p.currency === 'RSD').reduce((sum, p) => sum + p.amount, 0),
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency === 'RSD' ? 'RSD' : currency === 'EUR' ? 'EUR' : 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const filteredSuppliers = Array.isArray(suppliers) ? suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const filteredHotels = Array.isArray(hotels) ? hotels.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.country.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Geocoding function using OpenStreetMap
  const geocodeLocation = async (query: string, type: 'hotel' | 'supplier') => {
    if (!query) return;
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'IsplateApp/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data[0]) {
        const result = data[0];
        const geoData = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name || query,
          country: result.address?.country || result.address?.state || '',
        };
        
        if (type === 'hotel') {
          setGeoLocationData(geoData);
          setHotelForm(prev => ({
            ...prev,
            latitude: geoData.lat,
            longitude: geoData.lng,
            country: geoData.country,
            city: result.address?.city || result.address?.town || result.address?.village || prev.city || '',
          }));
        } else {
          setSupplierGeoData(geoData);
          setSupplierForm(prev => ({
            ...prev,
            latitude: geoData.lat,
            longitude: geoData.lng,
            country: geoData.country,
            address: result.display_name || prev.address || '',
          }));
        }
      } else {
        alert('Lokacija nije pronađena. Pokušajte sa preciznijim nazivom.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Greška pri povezivanju sa servisom za mape.');
    } finally {
      setIsGeocoding(false);
    }
  };

  if (!storageReady) return <div className="flex items-center justify-center h-screen bg-[var(--bg-main)]" style={{ color: 'var(--text-main)' }}>Učitavanje...</div>;

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-main)] p-6">
        <div className="w-full max-w-md glass-card p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />
          
          <div className="text-center relative">
            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
              <ShieldCheck size={40} className="text-blue-400" />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2">IsplateApp</h1>
            <p className="text-slate-500 text-lg">Prijavite se na svoj nalog</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Email adresa</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="email"
                  required
                  placeholder="primer@mejl.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl modern-input text-lg outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Lozinka</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="password"
                  required
                  placeholder="********"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl modern-input text-lg outline-none transition-all"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center font-bold animate-shake">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-blue-500 text-white font-black text-xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
            >
              Prijavi se
            </button>
          </form>

          <div className="text-center text-slate-600 text-sm relative">
            &copy; 2026 IsplateApp. Sva prava zadržana.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />}

      {/* Left Sidebar */}
      <div
        className={`glass-sidebar fixed lg:relative left-0 top-0 h-full z-40 overflow-y-auto transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: `${leftSidebarWidth}px` }}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Activity className="text-white" size={28} />
              </div>
              <h1 className="text-3xl font-black tracking-tighter">ISPLATE<span className="text-blue-500">PRO</span></h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/5 rounded-xl">
              <X size={24} />
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Dobavljači</p>
              <p className="text-2xl font-black">{stats.totalSuppliers}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Hoteli</p>
              <p className="text-2xl font-black">{stats.totalHotels}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-10">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Brze akcije</h3>
            <div className="space-y-2">
              <button
                onClick={() => { setActiveTab('payments'); setShowPaymentForm(true); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus size={20} /> Nova isplata
              </button>
              <button
                onClick={() => { setActiveTab('suppliers'); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all border border-white/5"
              >
                <Users size={20} className="text-purple-400" /> Novi dobavljač
              </button>
            </div>
          </div>

          {/* Navigation Modules */}
          <div className="mb-10">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Glavni moduli</h3>
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Kontrolna tabla', icon: PieChart },
                { id: 'payments', label: 'Isplate i transakcije', icon: CreditCard },
                { id: 'suppliers', label: 'Baza dobavljača', icon: Users },
                { id: 'hotels', label: 'Baza hotela', icon: Building2 },
                { id: 'users', label: 'Korisnici', icon: ShieldCheck },
                { id: 'settings', label: 'Podešavanja', icon: Settings },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                    activeTab === item.id 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <item.icon size={22} className={activeTab === item.id ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span className="text-lg font-bold">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Recent Activity Mini */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Status sistema</h3>
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-emerald-500/80">Sistem aktivan</span>
            </div>
          </div>
        </div>

        {/* Resize Handle Left */}
        <div 
          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors z-50"
          onMouseDown={() => setIsResizingLeft(true)}
        />
      </div>

      {/* Left Divider */}
      <div
        onMouseDown={() => setIsResizingLeft(true)}
        className="hidden lg:block w-1 bg-[var(--border-color)] hover:bg-[var(--accent-color)] cursor-col-resize transition-colors"
        style={{ cursor: isResizingLeft ? 'col-resize' : 'col-resize' }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div
          style={{ backgroundColor: 'var(--bg-main)' }}
          className="p-4 flex items-center justify-between"
        >
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu size={24} />
          </button>
          <div className="flex-1 mx-8 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Pretražite isplate, dobavljače ili hotele..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 rounded-2xl modern-input text-lg outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-base font-bold leading-none">{currentUser?.name}</p>
              <p className="text-xs text-slate-500 mt-1">{roleNames[currentUser?.role || 3]}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border flex items-center justify-center text-blue-400 font-bold" style={{ borderColor: 'var(--border-color)' }}>
              {currentUser?.name[0]}
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all ml-2 group relative"
              title="Odjavi se"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && activeSummaryView && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <button 
                    onClick={() => setActiveSummaryView(null)}
                    className="text-blue-400 hover:underline font-bold flex items-center gap-2 mb-4"
                  >
                    ← Nazad na kontrolnu tablu
                  </button>
                  <h2 className="text-4xl font-black tracking-tight">
                    {activeSummaryView === 'suppliers' ? 'Isplate po dobavljačima' : 
                     activeSummaryView === 'hotels' ? 'Isplate po hotelima' : 'Isplate po državama'}
                  </h2>
                  <p className="text-xl text-slate-500 mt-2">
                    Prikaz svih isplata u periodu od {new Date(analyticsFromDate).toLocaleDateString()} do {new Date(analyticsToDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider">
                        {activeSummaryView === 'suppliers' ? 'Dobavljač' : 
                         activeSummaryView === 'hotels' ? 'Hotel' : 'Država'}
                      </th>
                      <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">USD</th>
                      <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">EUR</th>
                      <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">RSD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                    {(activeSummaryView === 'suppliers' ? suppliers.map(s => {
                      const pms = filteredPayments.filter(p => p.supplierId === s.id);
                      return { 
                        name: s.name, 
                        usd: pms.filter(p => p.currency === 'USD').reduce((sum, p) => sum + p.amount, 0),
                        eur: pms.filter(p => p.currency === 'EUR').reduce((sum, p) => sum + p.amount, 0),
                        rsd: pms.filter(p => p.currency === 'RSD').reduce((sum, p) => sum + p.amount, 0)
                      };
                    }) : activeSummaryView === 'hotels' ? hotels.map(h => {
                      const pms = filteredPayments.filter(p => p.hotelId === h.id);
                      return { 
                        name: h.name, 
                        usd: pms.filter(p => p.currency === 'USD').reduce((sum, p) => sum + p.amount, 0),
                        eur: pms.filter(p => p.currency === 'EUR').reduce((sum, p) => sum + p.amount, 0),
                        rsd: pms.filter(p => p.currency === 'RSD').reduce((sum, p) => sum + p.amount, 0)
                      };
                    }) : Array.from(new Set(hotels.map(h => h.country))).map(country => {
                      const countryHotels = hotels.filter(h => h.country === country).map(h => h.id);
                      const pms = filteredPayments.filter(p => countryHotels.includes(p.hotelId));
                      return { 
                        name: country, 
                        usd: pms.filter(p => p.currency === 'USD').reduce((sum, p) => sum + p.amount, 0),
                        eur: pms.filter(p => p.currency === 'EUR').reduce((sum, p) => sum + p.amount, 0),
                        rsd: pms.filter(p => p.currency === 'RSD').reduce((sum, p) => sum + p.amount, 0)
                      };
                    }))
                    .filter(item => item.usd > 0 || item.eur > 0 || item.rsd > 0)
                    .sort((a, b) => (b.usd + b.eur + b.rsd) - (a.usd + a.eur + a.rsd))
                    .map((item, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors group">
                        <td className="p-6">
                          <span className="text-xl font-bold group-hover:text-blue-400 transition-colors">{item.name}</span>
                        </td>
                        <td className="p-6 text-right font-black text-amber-400 text-xl">
                          {item.usd > 0 ? formatCurrency(item.usd, 'USD') : '-'}
                        </td>
                        <td className="p-6 text-right font-black text-blue-400 text-xl">
                          {item.eur > 0 ? formatCurrency(item.eur, 'EUR') : '-'}
                        </td>
                        <td className="p-6 text-right font-black text-emerald-400 text-xl">
                          {item.rsd > 0 ? formatCurrency(item.rsd, 'RSD') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'overview' && !activeSummaryView && (
            <div className="space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-2">Kontrolna tabla</h2>
                  <p className="text-xl text-slate-500">Dobrodošli nazad, {currentUser?.name}. Evo pregleda vašeg poslovanja.</p>
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border hover:bg-white/10 transition-all text-lg font-semibold" style={{ borderColor: 'var(--border-color)' }}>
                    <Calendar size={20} /> Poslednjih 30 dana
                  </button>
                </div>
              </div>

              {/* Quick Links Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                  onClick={() => setActiveTab('payments')}
                  className="glass-card p-6 flex items-center gap-6 hover:bg-blue-500/5 transition-all group border-l-4 border-l-blue-500"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Plus size={28} />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold">Nova isplata</p>
                    <p className="text-sm text-slate-500">Evidentiraj novu transakciju</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('suppliers')}
                  className="glass-card p-6 flex items-center gap-6 hover:bg-purple-500/5 transition-all group border-l-4 border-l-purple-500"
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Users size={28} />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold">Dodaj dobavljača</p>
                    <p className="text-sm text-slate-500">Proširi bazu partnera</p>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('hotels')}
                  className="glass-card p-6 flex items-center gap-6 hover:bg-emerald-500/5 transition-all group border-l-4 border-l-emerald-500"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Building2 size={28} />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold">Dodaj hotel</p>
                    <p className="text-sm text-slate-500">Unesi novi objekat</p>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: 'Dobavljači', value: stats.totalSuppliers, icon: Users, color: 'blue' },
                  { label: 'Hoteli', value: stats.totalHotels, icon: Building2, color: 'purple' },
                  { label: 'Isplate', value: `${stats.completedPayments}/${stats.totalPayments}`, icon: CreditCard, color: 'emerald' },
                  { label: 'Ukupno USD', value: formatCurrency(stats.totalUSD, 'USD'), icon: DollarSign, color: 'amber' },
                  { label: 'Ukupno EUR', value: formatCurrency(stats.totalEUR, 'EUR'), icon: DollarSign, color: 'blue' },
                  { label: 'Ukupno RSD', value: formatCurrency(stats.totalRSD, 'RSD'), icon: DollarSign, color: 'emerald' },
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-4 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                        <stat.icon size={32} />
                      </div>
                      <div className="text-emerald-400 flex items-center gap-1 text-sm font-bold">
                        <TrendingUp size={16} /> +12%
                      </div>
                    </div>
                    <p className="text-lg font-medium text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-black">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Statistika po statusima */}
              <div className="glass-card p-8">
                <h3 className="text-2xl font-bold mb-6">Pregled isplata po statusima</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Na čekanju */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Activity size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold">Na čekanju</h4>
                        <p className="text-sm text-slate-500">{stats.pendingPayments} isplata</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <span className="font-semibold">EUR</span>
                        <span className="text-xl font-bold text-amber-400">{formatCurrency(stats.pendingEUR, 'EUR')}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <span className="font-semibold">RSD</span>
                        <span className="text-xl font-bold text-amber-400">{formatCurrency(stats.pendingRSD, 'RSD')}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <span className="font-semibold">USD</span>
                        <span className="text-xl font-bold text-amber-400">{formatCurrency(stats.pendingUSD, 'USD')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Isplaćeno */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold">Isplaćeno</h4>
                        <p className="text-sm text-slate-500">{stats.completedPayments} isplata</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <span className="font-semibold">EUR</span>
                        <span className="text-xl font-bold text-emerald-400">{formatCurrency(stats.completedEUR, 'EUR')}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <span className="font-semibold">RSD</span>
                        <span className="text-xl font-bold text-emerald-400">{formatCurrency(stats.completedRSD, 'RSD')}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <span className="font-semibold">USD</span>
                        <span className="text-xl font-bold text-emerald-400">{formatCurrency(stats.completedUSD, 'USD')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold">Nedavne isplate</h3>
                    <button 
                      onClick={() => setActiveTab('payments')}
                      className="text-blue-400 hover:underline font-semibold text-lg"
                    >
                      Vidi sve
                    </button>
                  </div>
                  <div className="space-y-6">
                    {filteredPayments.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <DollarSign size={24} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xl font-bold">{suppliers.find(s => s.id === p.supplierId)?.name}</p>
                          <p className="text-base text-slate-500">{p.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black">{formatCurrency(p.amount, p.currency)}</p>
                          <span className={`text-sm px-3 py-1 rounded-full font-bold ${
                            p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {p.status === 'completed' ? 'Završeno' : 'U obradi'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold">Distribucija po hotelima</h3>
                    <PieChart size={24} className="text-slate-500" />
                  </div>
                  <div className="space-y-4">
                    {hotels.slice(0, 4).map(hotel => {
                      const hotelPayments = payments.filter(p => p.hotelId === hotel.id);
                      const total = hotelPayments.reduce((sum, p) => sum + p.amount, 0);
                      const percentage = stats.totalRawAmount > 0 ? (total / stats.totalRawAmount) * 100 : 0;
                      return (
                        <div key={hotel.id} className="space-y-2">
                          <div className="flex justify-between text-sm font-bold">
                            <span>{hotel.name}</span>
                            <span>{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {hotels.length === 0 && (
                      <div className="h-48 flex items-center justify-center border-2 border-dashed rounded-3xl" style={{ borderColor: 'var(--border-color)' }}>
                        <p className="text-slate-500 text-lg">Nema podataka za prikaz</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-2">Isplate</h2>
                  <p className="text-xl text-slate-500">Upravljajte svim transakcijama i isplatama dobavljačima.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowPaymentForm(!showPaymentForm)} 
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all text-lg font-bold shadow-lg ${
                      showPaymentForm 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                      : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/25'
                    }`}
                  >
                    {showPaymentForm ? <X size={20} /> : <Plus size={20} />}
                    {showPaymentForm ? 'Zatvori formu' : 'Nova isplata'}
                  </button>
                  <button onClick={() => exportToPDF()} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border hover:bg-white/10 transition-all text-lg font-semibold" style={{ borderColor: 'var(--border-color)' }}>
                    <Download size={20} /> PDF
                  </button>
                  <button onClick={() => exportToExcel()} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border hover:bg-white/10 transition-all text-lg font-semibold" style={{ borderColor: 'var(--border-color)' }}>
                    <Upload size={20} /> Excel
                  </button>
                </div>
              </div>

              {showPaymentForm && (
                <div className="glass-card p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <button 
                      onClick={() => {
                        setShowPaymentForm(false);
                        setEditingId(null);
                        setPaymentForm({
                          supplierId: '',
                          hotelId: '',
                          amount: 0,
                          currency: 'EUR',
                          date: new Date().toISOString().split('T')[0],
                          description: '',
                          status: 'pending',
                          method: 'Bankarska transakcija',
                          bankName: '',
                          realizationYear: new Date().getFullYear(),
                          reservations: [],
                        });
                      }}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-500 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Plus className="text-blue-400" /> {editingId ? 'Izmeni isplatu' : 'Nova isplata'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dobavljač</label>
                      <select
                        value={paymentForm.supplierId || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, supplierId: e.target.value })}
                        className="w-full p-4 rounded-2xl modern-input text-lg"
                      >
                        <option value="">Izaberite dobavljača</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Hotel</label>
                      <select
                        value={paymentForm.hotelId || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, hotelId: e.target.value })}
                        className="w-full p-4 rounded-2xl modern-input text-lg"
                      >
                        <option value="">Izaberite hotel</option>
                        {hotels.map(h => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Iznos</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={paymentForm.amount || ''}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                          className="w-full p-4 rounded-2xl modern-input text-lg pl-10"
                        />
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      </div>
                      {paymentForm.amount ? (
                        <p className="text-xs font-bold text-blue-400 mt-1">
                          Pregled: {formatCurrency(paymentForm.amount, paymentForm.currency || 'EUR')}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Vrsta usluge</label>
                      <select
                        value={paymentForm.serviceType || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, serviceType: e.target.value })}
                        className="w-full p-4 rounded-2xl modern-input text-lg"
                      >
                        <option value="">Izaberite uslugu</option>
                        <option value="Smeštaj">Smeštaj</option>
                        <option value="Avio Prevoz">Avio Prevoz</option>
                        <option value="Bus">Bus</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Izleti">Izleti</option>
                        <option value="Ulaznice">Ulaznice</option>
                        <option value="Obroci">Obroci</option>
                        <option value="Svečana večera">Svečana večera</option>
                        <option value="Viza">Viza</option>
                        <option value="Vodič">Vodič</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Valuta</label>
                    <select
                      value={paymentForm.currency || 'EUR'}
                      onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value as Currency })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    >
                      {['USD', 'EUR', 'RSD'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Datum</label>
                    <input
                      type="date"
                      value={paymentForm.date || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    />
                  </div>
                  
                  {/* Tip dokumenta i Broj dokumenta - u 2 kolone */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tip dokumenta</label>
                    <select
                      value={paymentForm.documentType || 'Profaktura'}
                      onChange={(e) => setPaymentForm({ ...paymentForm, documentType: e.target.value })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    >
                      <option value="Profaktura">Profaktura</option>
                      <option value="Avansni Račun">Avansni Račun</option>
                      <option value="Konačni račun">Konačni račun</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Broj dokumenta</label>
                    <input
                      type="text"
                      value={paymentForm.documentNumber || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, documentNumber: e.target.value })}
                      placeholder="Unesite broj dokumenta..."
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Godina Realizacije</label>
                    <select
                      value={paymentForm.realizationYear || new Date().getFullYear()}
                      onChange={(e) => setPaymentForm({ ...paymentForm, realizationYear: parseInt(e.target.value) })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    >
                      {[2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Status</label>
                    <select
                      value={paymentForm.status || 'pending'}
                      onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as any })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    >
                      <option value="pending">Na čekanju</option>
                      <option value="completed">Isplaćeno</option>
                    </select>
                  </div>
                  
                  {/* Prikaži polje za datum plaćanja samo ako je status "Na čekanju" */}
                  {paymentForm.status === 'pending' && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Rok za isplatu</label>
                      <input
                        type="date"
                        value={paymentForm.dueDate || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                        className="w-full p-4 rounded-2xl modern-input text-lg"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Metoda</label>
                    <select
                      value={paymentForm.method || 'Bankarska transakcija'}
                      onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    >
                      <option value="Bankarska transakcija">Bankarska transakcija</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Keš">Keš</option>
                      <option value="Kompenzacija">Kompenzacija</option>
                    </select>
                  </div>
                </div>

                {(paymentForm.method === 'Bankarska transakcija' || paymentForm.method === 'Credit Card') && (
                  <div className="space-y-2 mb-6">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Banka</label>
                    <select
                      value={paymentForm.bankName || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    >
                      <option value="">Izaberite banku</option>
                      <option value="Banka Intesa">Banka Intesa</option>
                      <option value="Aik Banka">Aik Banka</option>
                      <option value="Unicredit banka">Unicredit banka</option>
                      <option value="Otp Banka">Otp Banka</option>
                    </select>
                  </div>
                )}

                <div className="space-y-2 mb-6">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Opis</label>
                  <textarea
                    placeholder="Dodatne informacije o isplati..."
                    value={paymentForm.description || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                    className="w-full p-4 rounded-2xl modern-input text-lg h-24 resize-none"
                  />
                </div>

                {/* Reservation Numbers */}
                <div className="space-y-4 mb-8">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Brojevi rezervacija</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Unesite broj i pritisnite Enter..."
                      value={reservationInput}
                      onChange={(e) => setReservationInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && reservationInput.trim()) {
                          setPaymentForm({
                            ...paymentForm,
                            reservations: [...(paymentForm.reservations || []), reservationInput.trim()]
                          });
                          setReservationInput('');
                        }
                      }}
                      className="flex-1 p-4 rounded-2xl modern-input text-lg"
                    />
                    <button
                      onClick={() => {
                        if (reservationInput.trim()) {
                          setPaymentForm({
                            ...paymentForm,
                            reservations: [...(paymentForm.reservations || []), reservationInput.trim()]
                          });
                          setReservationInput('');
                        }
                      }}
                      className="px-8 py-4 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                    >
                      Dodaj
                    </button>
                  </div>

                  {paymentForm.reservations && paymentForm.reservations.length > 0 && (
                    <div className="flex flex-wrap gap-3 p-4 rounded-2xl bg-white/5 border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                      {paymentForm.reservations.map((res, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-base font-bold flex items-center gap-3 border border-blue-500/30"
                        >
                          {res}
                          <button
                            onClick={() => {
                              setPaymentForm({
                                ...paymentForm,
                                reservations: paymentForm.reservations?.filter((_, i) => i !== idx)
                              });
                            }}
                            className="hover:text-white transition-colors"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={addPayment}
                  className="w-full p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xl font-black hover:from-blue-500 hover:to-blue-400 transition-all shadow-xl shadow-blue-500/25"
                >
                  {editingId ? 'Ažuriraj podatke o isplati' : 'Potvrdi i sačuvaj isplatu'}
                </button>
              </div>
              )}

              <div className="glass-card overflow-hidden">
                <div className="p-8 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                  <h3 className="text-2xl font-bold">Istorija isplata</h3>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-xl hover:bg-white/5 transition-colors"><Filter size={20} /></button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Dobavljač / Hotel</th>
                        <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Usluga</th>
                        <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Iznos</th>
                        <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Datum</th>
                        <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Rezervacije</th>
                        <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Akcije</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                      {filteredPayments.map(payment => (
                        <tr key={payment.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-6">
                            <p className="text-xl font-bold">{suppliers.find(s => s.id === payment.supplierId)?.name || 'N/A'}</p>
                            <p className="text-base text-slate-500">{hotels.find(h => h.id === payment.hotelId)?.name || 'N/A'}</p>
                          </td>
                          <td className="p-6">
                            <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-bold border border-blue-500/20">
                              {payment.serviceType || 'N/A'}
                            </span>
                          </td>
                          <td className="p-6">
                            <p className="text-xl font-black">{formatCurrency(payment.amount, payment.currency)}</p>
                            <p className="text-sm text-slate-500">
                              {payment.method}
                              {payment.bankName && ` (${payment.bankName})`}
                            </p>
                          </td>
                          <td className="p-6">
                            <p className="text-lg">{payment.date}</p>
                            {payment.status === 'pending' && payment.dueDate && (
                              <p className="text-xs text-amber-400 font-semibold mt-1">
                                Rok: {payment.dueDate}
                              </p>
                            )}
                          </td>
                          <td className="p-6">
                            <div className="flex flex-wrap gap-2 max-w-[200px]">
                              {Array.isArray(payment.reservations) ? payment.reservations.map((res, idx) => (
                                <span key={idx} className="px-2 py-1 rounded-lg bg-slate-700 text-xs font-bold text-slate-300">
                                  {res}
                                </span>
                              )) : <span className="text-slate-600">-</span>}
                            </div>
                          </td>
                          <td className="p-6">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                              payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                payment.status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'
                              }`} />
                              {payment.status === 'completed' ? 'Isplaćeno' : 'Na čekanju'}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => editItem('payment', payment.id)} className="p-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all">
                                <Edit2 size={20} />
                              </button>
                              <button onClick={() => deleteItem('payment', payment.id)} className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-2">Dobavljači</h2>
                  <p className="text-xl text-slate-500">Upravljajte listom partnera i njihovim podacima za plaćanje.</p>
                </div>
              </div>

              <div className="glass-card p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Users className="text-purple-400" /> {editingId ? 'Izmeni dobavljača' : 'Novi dobavljač'}
                </h3>
                
                <div className="flex gap-4 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                      type="text" 
                      placeholder="Pretraži dobavljača po nazivu za automatsko lociranje..."
                      value={supplierSearchQuery}
                      onChange={(e) => setSupplierSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && geocodeLocation(supplierSearchQuery, 'supplier')}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl modern-input text-lg" 
                    />
                  </div>
                  <button 
                    onClick={() => geocodeLocation(supplierSearchQuery, 'supplier')}
                    disabled={isGeocoding}
                    className="px-8 py-4 rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGeocoding ? <Activity className="animate-spin" size={20} /> : <MapIcon size={20} />}
                    {isGeocoding ? 'Pretražujem...' : 'Pronađi lokaciju'}
                  </button>
                </div>

                {supplierGeoData && (
                  <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                          <Activity size={24} />
                        </div>
                        <div>
                          <p className="text-lg font-bold">Lokacija uspešno pronađena</p>
                          <p className="text-base text-slate-400">{supplierGeoData.country} ({supplierGeoData.lat.toFixed(4)}, {supplierGeoData.lng.toFixed(4)})</p>
                        </div>
                      </div>
                      <button onClick={() => setSupplierGeoData(null)} className="text-slate-500 hover:text-white">✕</button>
                    </div>
                    
                    <div className="relative w-full h-80 rounded-3xl overflow-hidden border-2 border-purple-500/30 shadow-2xl">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${supplierGeoData.lng - 0.005}%2C${supplierGeoData.lat - 0.005}%2C${supplierGeoData.lng + 0.005}%2C${supplierGeoData.lat + 0.005}&layer=mapnik&marker=${supplierGeoData.lat}%2C${supplierGeoData.lng}`}
                      />
                      <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold border border-white/10">
                        Potvrdite lokaciju na mapi
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Naziv firme</label>
                    <input type="text" placeholder="Ime dobavljača" value={supplierForm.name || ''} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Email adresa</label>
                    <input type="email" placeholder="kontakt@firma.com" value={supplierForm.email || ''} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Telefon</label>
                    <input type="text" placeholder="+381..." value={supplierForm.phone || ''} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Adresa sedišta</label>
                    <input type="text" placeholder="Ulica i broj, Grad" value={supplierForm.address || ''} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Bankovni račun (IBAN)</label>
                    <input type="text" placeholder="RS35..." value={supplierForm.bankAccount || ''} onChange={(e) => setSupplierForm({ ...supplierForm, bankAccount: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kontakt osoba</label>
                    <input type="text" placeholder="Ime i prezime" value={supplierForm.contactPerson || ''} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                </div>
                <button onClick={addSupplier} className="w-full p-5 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xl font-black hover:from-purple-500 hover:to-purple-400 transition-all shadow-xl shadow-purple-500/25">
                  {editingId ? 'Sačuvaj izmene' : 'Dodaj novog dobavljača'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map(supplier => (
                  <div key={supplier.id} className="glass-card p-6 group hover:border-purple-500/50 transition-all">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 text-2xl font-black">
                        {supplier.name[0]}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => editItem('supplier', supplier.id)} className="p-2 rounded-xl bg-white/5 hover:bg-purple-500/20 text-purple-400 transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => deleteItem('supplier', supplier.id)} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-red-400 transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold mb-1">{supplier.name}</h4>
                    <p className="text-base text-slate-500 mb-4 flex items-center gap-2"><Building2 size={16} /> {supplier.address}</p>
                    <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Kontakt</p>
                      <p className="text-lg font-medium">{supplier.email}</p>
                      <p className="text-lg font-medium">{supplier.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'hotels' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-2">Hoteli</h2>
                  <p className="text-xl text-slate-500">Upravljajte objektima i njihovim kapacitetima.</p>
                </div>
              </div>

              <div className="glass-card p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Building2 className="text-emerald-400" /> {editingId ? 'Izmeni hotel' : 'Novi hotel'}
                </h3>
                
                <div className="flex gap-4 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                      type="text" 
                      placeholder="Pretraži hotel po nazivu za automatsko lociranje..."
                      value={hotelSearchQuery}
                      onChange={(e) => setHotelSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && geocodeLocation(hotelSearchQuery, 'hotel')}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl modern-input text-lg" 
                    />
                  </div>
                  <button 
                    onClick={() => geocodeLocation(hotelSearchQuery, 'hotel')}
                    disabled={isGeocoding}
                    className="px-8 py-4 rounded-2xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGeocoding ? <Activity className="animate-spin" size={20} /> : <MapIcon size={20} />}
                    {isGeocoding ? 'Pretražujem...' : 'Pronađi lokaciju'}
                  </button>
                </div>

                {geoLocationData && (
                  <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Activity size={24} />
                        </div>
                        <div>
                          <p className="text-lg font-bold">Lokacija uspešno pronađena</p>
                          <p className="text-base text-slate-400">{geoLocationData.country} ({geoLocationData.lat.toFixed(4)}, {geoLocationData.lng.toFixed(4)})</p>
                        </div>
                      </div>
                      <button onClick={() => setGeoLocationData(null)} className="text-slate-500 hover:text-white">✕</button>
                    </div>

                    <div className="relative w-full h-80 rounded-3xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${geoLocationData.lng - 0.005}%2C${geoLocationData.lat - 0.005}%2C${geoLocationData.lng + 0.005}%2C${geoLocationData.lat + 0.005}&layer=mapnik&marker=${geoLocationData.lat}%2C${geoLocationData.lng}`}
                      />
                      <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold border border-white/10">
                        Potvrdite lokaciju na mapi
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Naziv hotela</label>
                    <input type="text" placeholder="Ime hotela" value={hotelForm.name || ''} onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dobavljač</label>
                    <select
                      value={hotelForm.supplierId || ''}
                      onChange={(e) => setHotelForm({ ...hotelForm, supplierId: e.target.value })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    >
                      <option value="">Izaberite dobavljača</option>
                      {suppliers.filter(s => !s.deleted).map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Grad</label>
                    <input type="text" placeholder="Grad" value={hotelForm.city || ''} onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Broj soba</label>
                    <input type="number" placeholder="0" value={hotelForm.rooms || ''} onChange={(e) => setHotelForm({ ...hotelForm, rooms: parseInt(e.target.value) })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Telefon recepcije</label>
                    <input type="text" placeholder="+381..." value={hotelForm.phone || ''} onChange={(e) => setHotelForm({ ...hotelForm, phone: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Menadžer</label>
                    <input type="text" placeholder="Ime i prezime" value={hotelForm.manager || ''} onChange={(e) => setHotelForm({ ...hotelForm, manager: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kontakt osoba</label>
                    <input type="text" placeholder="Ime i prezime" value={hotelForm.contactPerson || ''} onChange={(e) => setHotelForm({ ...hotelForm, contactPerson: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Država</label>
                    <input type="text" placeholder="Država" value={hotelForm.country || ''} onChange={(e) => setHotelForm({ ...hotelForm, country: e.target.value })} className="w-full p-4 rounded-2xl modern-input text-lg" />
                  </div>
                </div>
                <button onClick={addHotel} className="w-full p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xl font-black hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-xl shadow-emerald-500/25">
                  {editingId ? 'Sačuvaj izmene' : 'Dodaj novi hotel'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHotels.map(hotel => (
                  <div key={hotel.id} className="glass-card p-6 group hover:border-emerald-500/50 transition-all">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-2xl font-black">
                        {hotel.name[0]}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => editItem('hotel', hotel.id)} className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-emerald-400 transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => deleteItem('hotel', hotel.id)} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-red-400 transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold mb-1">{hotel.name}</h4>
                    <p className="text-base text-slate-500 mb-4 flex items-center gap-2"><Building2 size={16} /> {hotel.city}, {hotel.country}</p>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sobe</p>
                        <p className="text-lg font-black">{hotel.rooms}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Menadžer</p>
                        <p className="text-lg font-medium truncate">{hotel.manager}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-2">Korisnici</h2>
                  <p className="text-xl text-slate-500">Upravljajte pristupom i ulogama članova tima.</p>
                </div>
              </div>

              {/* User Form */}
              <div className="glass-card p-8">
                <h3 className="text-2xl font-bold mb-6">{editingId ? 'Izmeni korisnika' : 'Dodaj novog korisnika'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ime i prezime</label>
                    <input
                      type="text"
                      placeholder="Unesite ime i prezime..."
                      value={userForm.name || ''}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Mejl adresa</label>
                    <input
                      type="email"
                      placeholder="primer@mejl.com"
                      value={userForm.email || ''}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Šifra</label>
                    <input
                      type="password"
                      placeholder="********"
                      value={userForm.password || ''}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Uloga</label>
                    <select
                      value={userForm.role || 3}
                      onChange={(e) => setUserForm({ ...userForm, role: parseInt(e.target.value) as AccessLevel })}
                      className="w-full p-4 rounded-2xl modern-input text-lg"
                    >
                      <option value={1}>Admin</option>
                      <option value={2}>Editor</option>
                      <option value={3}>Viewer</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={addUser}
                    className="px-8 py-4 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                  >
                    <Plus size={20} /> {editingId ? 'Sačuvaj izmene' : 'Dodaj korisnika'}
                  </button>
                  {editingId && (
                    <button
                      onClick={() => { setEditingId(null); setUserForm({ name: '', email: '', password: '', role: 3 }); }}
                      className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all"
                    >
                      Otkaži
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                  <div key={user.id} className="glass-card p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150" />
                    <div className="flex items-center gap-6 mb-6 relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-3xl font-black shadow-xl">
                        {user.name[0]}
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold">{user.name}</h4>
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold mt-1 ${
                          user.role === 1 ? 'bg-red-500/10 text-red-400' :
                          user.role === 2 ? 'bg-blue-500/10 text-blue-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {roleNames[user.role]}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4 relative">
                      <div className="flex items-center justify-between text-lg">
                        <span className="text-slate-500">Email</span>
                        <span className="font-medium">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-lg">
                        <span className="text-slate-500">Poslednja prijava</span>
                        <span className="font-medium">{new Date(user.lastLogin).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t flex gap-3 relative" style={{ borderColor: 'var(--border-color)' }}>
                      <button 
                        onClick={() => editItem('user', user.id)}
                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Edit2 size={18} /> Izmeni
                      </button>
                      <button 
                        onClick={() => deleteItem('user', user.id)}
                        className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-2">Sistemska podešavanja</h2>
                  <p className="text-xl text-slate-500">Konfiguracija aplikacije, tema i bezbednosti.</p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/10">
                <button
                  onClick={() => {
                    setSettingsView('general');
                    setLogsLimit(50);
                    setLogsFromDate('');
                    setLogsToDate('');
                  }}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
                    settingsView === 'general' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Settings className="inline mr-2" size={20} />
                  Opšte
                </button>
                {currentUser?.role === 1 && (
                  <>
                    <button
                      onClick={() => {
                        setSettingsView('logs');
                        setLogsSearchQuery('');
                        setLogsFromDate('');
                        setLogsToDate('');
                        setLogsLimit(50);
                      }}
                      className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
                        settingsView === 'logs' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Activity className="inline mr-2" size={20} />
                      Logovi
                    </button>
                    <button
                      onClick={() => {
                        setSettingsView('deleted');
                        setLogsLimit(50);
                        setLogsFromDate('');
                        setLogsToDate('');
                      }}
                      className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
                        settingsView === 'deleted' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Trash2 className="inline mr-2" size={20} />
                      Obrisani podaci
                    </button>
                    <button
                      onClick={() => setSettingsView('ai-training')}
                      className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
                        settingsView === 'ai-training' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Brain className="inline mr-2" size={20} />
                      AI Obuka
                    </button>
                  </>
                )}
              </div>

              {/* General Settings View */}
              {settingsView === 'general' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="glass-card p-8">
                    <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                      <Settings className="text-blue-400" /> Izgled i Tema
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {themes.map(t => (
                        <button
                          key={t}
                          onClick={() => {
                            setCurrentTheme(t);
                            document.documentElement.setAttribute('data-theme', t);
                            localStorage.setItem('theme', t);
                          }}
                          className={`p-6 rounded-3xl border-2 transition-all text-left group ${
                            currentTheme === t ? 'border-blue-500 bg-blue-500/5' : 'border-transparent bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="w-full aspect-video rounded-xl mb-4 shadow-inner overflow-hidden border border-white/10">
                            <div className="w-full h-full" style={{ backgroundColor: 
                              t === 'github-dark' ? '#0f172a' : 
                              t === 'github-dark-dimmed' ? '#18181b' : 
                              t === 'github-dark-blue' ? '#0c4a6e' : '#f8fafc' 
                            }} />
                          </div>
                          <p className="font-bold capitalize text-lg">{t.replace('github-', '').replace('-', ' ')}</p>
                          <div className={`w-6 h-6 rounded-full mt-2 flex items-center justify-center ${currentTheme === t ? 'bg-blue-500' : 'bg-slate-700'}`}>
                            {currentTheme === t && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-8">
                    <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                      <Activity className="text-purple-400" /> Upravljanje podacima (Import/Export)
                    </h3>
                    <div className="space-y-8">
                      {/* Export Section - Admin Only */}
                      {currentUser?.role === 1 ? (
                        <div className="p-6 rounded-2xl bg-white/5 border" style={{ borderColor: 'var(--border-color)' }}>
                          <div className="mb-6">
                            <p className="text-xl font-bold">Izvoz podataka</p>
                            <p className="text-base text-slate-500">Preuzmite izveštaje u različitim formatima. (Samo za Admina)</p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <button onClick={exportToExcel} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                              <Download size={24} className="text-emerald-400" />
                              <span className="font-bold text-sm">Excel</span>
                            </button>
                            <button onClick={exportToPDF} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                              <Download size={24} className="text-red-400" />
                              <span className="font-bold text-sm">PDF</span>
                            </button>
                            <button onClick={exportToXML} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all">
                              <Download size={24} className="text-orange-400" />
                              <span className="font-bold text-sm">XML</span>
                            </button>
                            <button onClick={exportToHTML} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                              <Download size={24} className="text-blue-400" />
                              <span className="font-bold text-sm">HTML</span>
                            </button>
                            <button onClick={exportToJSON} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all">
                              <Download size={24} className="text-purple-400" />
                              <span className="font-bold text-sm">JSON</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
                          <ShieldCheck className="mx-auto text-slate-600 mb-2" size={32} />
                          <p className="text-slate-500 font-medium">Izvoz podataka je dozvoljen samo administratorima.</p>
                        </div>
                      )}
                      
                      {/* Import Section - Admin & Editor */}
                      {currentUser?.role && currentUser.role <= 2 ? (
                        <div className="p-6 rounded-2xl bg-white/5 border" style={{ borderColor: 'var(--border-color)' }}>
                          <div className="mb-6">
                            <p className="text-xl font-bold">Uvoz podataka</p>
                            <p className="text-base text-slate-500">Učitajte podatke u bazu dobavljača ili hotela.</p>
                          </div>
                          
                          <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="flex-1 space-y-2">
                              <label className="text-sm font-bold text-slate-500 uppercase">Ciljna baza</label>
                              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                                <button 
                                  onClick={() => setImportTarget('suppliers')}
                                  className={`py-2 px-4 rounded-lg font-bold text-sm transition-all ${importTarget === 'suppliers' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                  Dobavljači
                                </button>
                                <button 
                                  onClick={() => setImportTarget('hotels')}
                                  className={`py-2 px-4 rounded-lg font-bold text-sm transition-all ${importTarget === 'hotels' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                  Hoteli
                                </button>
                              </div>
                            </div>

                            <label className="flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-bold hover:bg-white/20 transition-all cursor-pointer">
                              <Upload size={20} />
                              Izaberi fajl (JSON, Excel, XML, PDF, HTML)
                              <input 
                                type="file" 
                                accept=".json,.xlsx,.xls,.xml,.pdf,.html,.htm" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImport(file);
                                }} 
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
                          <ShieldCheck className="mx-auto text-slate-600 mb-2" size={32} />
                          <p className="text-slate-500 font-medium">Uvoz podataka je dozvoljen samo administratorima i editorima.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="glass-card p-8">
                    <h3 className="text-2xl font-bold mb-6">Informacije</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between text-lg">
                        <span className="text-slate-500">Verzija</span>
                        <span className="font-bold">2.4.0-pro</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-slate-500">Baza podataka</span>
                        <span className="font-bold text-emerald-400">SQLite (Active)</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-slate-500">Poslednji backup</span>
                        <span className="font-bold">Danas, 14:20</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Logs View - Admin Only */}
              {settingsView === 'logs' && currentUser?.role === 1 && (
                <div className="glass-card p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Activity className="text-purple-400" /> Sistem Logova
                  </h3>
                  
                  {/* Search Filter */}
                  <div className="mb-6 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-lg font-bold mb-4 text-slate-300">Pretraga</h4>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <input
                        type="text"
                        value={logsSearchQuery}
                        onChange={(e) => setLogsSearchQuery(e.target.value)}
                        placeholder="Pretražite po akciji, detaljima ili korisniku..."
                        className="w-full p-4 pl-12 rounded-xl modern-input text-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Date Filters */}
                  <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-lg font-bold mb-4 text-slate-300">Filtriranje po datumu</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Od datuma</label>
                        <input
                          type="date"
                          value={logsFromDate}
                          onChange={(e) => setLogsFromDate(e.target.value)}
                          className="w-full p-3 rounded-xl modern-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Do datuma</label>
                        <input
                          type="date"
                          value={logsToDate}
                          onChange={(e) => setLogsToDate(e.target.value)}
                          className="w-full p-3 rounded-xl modern-input"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => {
                          setLogsSearchQuery('');
                          setLogsFromDate('');
                          setLogsToDate('');
                          setLogsLimit(50);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-500 transition-all font-semibold"
                      >
                        Resetuj filtere
                      </button>
                      <div className="text-sm text-slate-400 flex items-center">
                        Prikazano: {(() => {
                          const filtered = activityLogs.filter(log => {
                            // Search filter
                            if (logsSearchQuery) {
                              const query = logsSearchQuery.toLowerCase();
                              const matchesSearch = 
                                log.action.toLowerCase().includes(query) ||
                                log.details.toLowerCase().includes(query) ||
                                log.user.toLowerCase().includes(query);
                              if (!matchesSearch) return false;
                            }
                            
                            // Date filter
                            if (!logsFromDate && !logsToDate) return true;
                            const logDate = new Date(log.timestamp);
                            const from = logsFromDate ? new Date(logsFromDate) : null;
                            const to = logsToDate ? new Date(logsToDate) : null;
                            
                            if (from) from.setHours(0, 0, 0, 0);
                            if (to) to.setHours(23, 59, 59, 999);
                            
                            if (from && to) return logDate >= from && logDate <= to;
                            if (from) return logDate >= from;
                            if (to) return logDate <= to;
                            return true;
                          });
                          return Math.min(filtered.length, logsLimit);
                        })()} / {activityLogs.length} logova
                      </div>
                    </div>
                  </div>
                  
                  {/* Logs List */}
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {(() => {
                      const filtered = activityLogs.filter(log => {
                        // Search filter
                        if (logsSearchQuery) {
                          const query = logsSearchQuery.toLowerCase();
                          const matchesSearch = 
                            log.action.toLowerCase().includes(query) ||
                            log.details.toLowerCase().includes(query) ||
                            log.user.toLowerCase().includes(query);
                          if (!matchesSearch) return false;
                        }
                        
                        // Date filter
                        if (!logsFromDate && !logsToDate) return true;
                        const logDate = new Date(log.timestamp);
                        const from = logsFromDate ? new Date(logsFromDate) : null;
                        const to = logsToDate ? new Date(logsToDate) : null;
                        
                        if (from) from.setHours(0, 0, 0, 0);
                        if (to) to.setHours(23, 59, 59, 999);
                        
                        if (from && to) return logDate >= from && logDate <= to;
                        if (from) return logDate >= from;
                        if (to) return logDate <= to;
                        return true;
                      }).slice(0, logsLimit);
                      
                      return filtered.length > 0 ? filtered.map((log) => (
                        <div key={log.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Activity size={18} className="text-purple-400" />
                                <p className="text-xl font-bold">{log.action}</p>
                              </div>
                              <p className="text-base text-slate-400 mb-2">{log.details}</p>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span>👤 {log.user}</span>
                                <span>🕐 {new Date(log.timestamp).toLocaleString('sr-RS')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12 text-slate-500">
                          <Activity size={48} className="mx-auto mb-4 opacity-30" />
                          <p className="text-xl">Nema logova za prikazane filtere</p>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Load More Button */}
                  {(() => {
                    const filtered = activityLogs.filter(log => {
                      // Search filter
                      if (logsSearchQuery) {
                        const query = logsSearchQuery.toLowerCase();
                        const matchesSearch = 
                          log.action.toLowerCase().includes(query) ||
                          log.details.toLowerCase().includes(query) ||
                          log.user.toLowerCase().includes(query);
                        if (!matchesSearch) return false;
                      }
                      
                      // Date filter
                      if (!logsFromDate && !logsToDate) return true;
                      const logDate = new Date(log.timestamp);
                      const from = logsFromDate ? new Date(logsFromDate) : null;
                      const to = logsToDate ? new Date(logsToDate) : null;
                      
                      if (from) from.setHours(0, 0, 0, 0);
                      if (to) to.setHours(23, 59, 59, 999);
                      
                      if (from && to) return logDate >= from && logDate <= to;
                      if (from) return logDate >= from;
                      if (to) return logDate <= to;
                      return true;
                    });
                    
                    return filtered.length > logsLimit && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => setLogsLimit(prev => prev + 50)}
                          className="px-8 py-4 rounded-2xl bg-purple-500 hover:bg-purple-600 transition-all font-bold text-lg"
                        >
                          Prikaži još ({filtered.length - logsLimit} preostalih)
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Deleted Items View - Admin Only */}
              {settingsView === 'deleted' && currentUser?.role === 1 && (
                <div className="space-y-8">
                  <div className="glass-card p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold flex items-center gap-3">
                        <Trash2 className="text-red-400" /> Upravljanje obrisanim podacima
                      </h3>
                      <button
                        onClick={() => { setShowDeletedItems(!showDeletedItems); }}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${
                          showDeletedItems ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {showDeletedItems ? 'Prikaži samo aktivne' : 'Prikaži obrisane'}
                      </button>
                    </div>
                    
                    {showDeletedItems && (
                      <div className="space-y-6">
                        {/* Deleted Payments */}
                        {payments.filter(p => p.deleted).length > 0 && (
                          <div>
                            <h4 className="text-xl font-bold mb-4 text-red-400">Obrisane isplate ({payments.filter(p => p.deleted).length})</h4>
                            <div className="space-y-3">
                              {payments.filter(p => p.deleted).map(payment => (
                                <div key={payment.id} className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-lg font-bold">{payment.description}</p>
                                      <p className="text-sm text-slate-400">
                                        Iznos: {payment.amount} {payment.currency} | 
                                        Obrisao: {payment.deletedBy} | 
                                        Datum brisanja: {payment.deletedAt ? new Date(payment.deletedAt).toLocaleString('sr-RS') : 'N/A'}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => restoreItem('payment', payment.id)}
                                        className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all font-bold"
                                      >
                                        Vrati
                                      </button>
                                      <button
                                        onClick={() => hardDeleteItem('payment', payment.id)}
                                        className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all font-bold"
                                      >
                                        Trajno obriši
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Deleted Suppliers */}
                        {suppliers.filter(s => s.deleted).length > 0 && (
                          <div>
                            <h4 className="text-xl font-bold mb-4 text-red-400">Obrisani dobavljači ({suppliers.filter(s => s.deleted).length})</h4>
                            <div className="space-y-3">
                              {suppliers.filter(s => s.deleted).map(supplier => (
                                <div key={supplier.id} className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-lg font-bold">{supplier.name}</p>
                                      <p className="text-sm text-slate-400">
                                        Email: {supplier.email} | 
                                        Obrisao: {supplier.deletedBy} | 
                                        Datum brisanja: {supplier.deletedAt ? new Date(supplier.deletedAt).toLocaleString('sr-RS') : 'N/A'}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => restoreItem('supplier', supplier.id)}
                                        className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all font-bold"
                                      >
                                        Vrati
                                      </button>
                                      <button
                                        onClick={() => hardDeleteItem('supplier', supplier.id)}
                                        className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all font-bold"
                                      >
                                        Trajno obriši
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Deleted Hotels */}
                        {hotels.filter(h => h.deleted).length > 0 && (
                          <div>
                            <h4 className="text-xl font-bold mb-4 text-red-400">Obrisani hoteli ({hotels.filter(h => h.deleted).length})</h4>
                            <div className="space-y-3">
                              {hotels.filter(h => h.deleted).map(hotel => (
                                <div key={hotel.id} className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-lg font-bold">{hotel.name}</p>
                                      <p className="text-sm text-slate-400">
                                        Grad: {hotel.city} | 
                                        Obrisao: {hotel.deletedBy} | 
                                        Datum brisanja: {hotel.deletedAt ? new Date(hotel.deletedAt).toLocaleString('sr-RS') : 'N/A'}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => restoreItem('hotel', hotel.id)}
                                        className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all font-bold"
                                      >
                                        Vrati
                                      </button>
                                      <button
                                        onClick={() => hardDeleteItem('hotel', hotel.id)}
                                        className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all font-bold"
                                      >
                                        Trajno obriši
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {payments.filter(p => p.deleted).length === 0 && 
                         suppliers.filter(s => s.deleted).length === 0 && 
                         hotels.filter(h => h.deleted).length === 0 && (
                          <div className="text-center py-12">
                            <p className="text-xl text-slate-500">Nema obrisanih podataka</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!showDeletedItems && (
                      <div className="text-center py-12">
                        <Trash2 size={64} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-xl text-slate-500">Kliknite na dugme iznad da prikažete obrisane podatke</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Training View - Admin Only */}
              {settingsView === 'ai-training' && currentUser?.role === 1 && (
                <div className="glass-card p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Brain className="text-purple-400" /> AI Obučavanje Asistenta
                  </h3>

                  {/* Add Training Data */}
                  <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20">
                    <h4 className="text-lg font-bold mb-4 text-purple-300">Dodaj novo znanje</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Pitanje</label>
                        <input
                          type="text"
                          value={aiTrainingQuestion}
                          onChange={(e) => setAiTrainingQuestion(e.target.value)}
                          placeholder="npr: Koliko je dugovanja ukupno?"
                          className="w-full p-4 rounded-xl modern-input text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Odgovor</label>
                        <textarea
                          value={aiTrainingAnswer}
                          onChange={(e) => setAiTrainingAnswer(e.target.value)}
                          placeholder="npr: Ukupno dugovanje iznosi X EUR"
                          className="w-full p-4 rounded-xl modern-input text-lg h-32 resize-none"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (aiTrainingQuestion && aiTrainingAnswer) {
                            const newData = [...aiTrainingData, { question: aiTrainingQuestion, answer: aiTrainingAnswer }];
                            setAiTrainingData(newData);
                            saveToStorage('aiTrainingData', newData);
                            setAiTrainingQuestion('');
                            setAiTrainingAnswer('');
                            logActivity('Dodao AI trening podatak', aiTrainingQuestion);
                          }
                        }}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-lg transition-all"
                      >
                        <Plus className="inline mr-2" size={20} />
                        Dodaj
                      </button>
                    </div>
                  </div>

                  {/* Import/Export Buttons */}
                  <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-lg font-bold mb-4 text-slate-300">Import / Export</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <button
                        onClick={() => exportAiTrainingData('json')}
                        className="py-3 px-4 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all font-bold"
                      >
                        <Download className="inline mr-2" size={18} />
                        Export JSON
                      </button>
                      <button
                        onClick={() => exportAiTrainingData('xlsx')}
                        className="py-3 px-4 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all font-bold"
                      >
                        <Download className="inline mr-2" size={18} />
                        Export Excel
                      </button>
                      <button
                        onClick={() => exportAiTrainingData('xml')}
                        className="py-3 px-4 rounded-xl bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-white transition-all font-bold"
                      >
                        <Download className="inline mr-2" size={18} />
                        Export XML
                      </button>
                      <button
                        onClick={() => exportAiTrainingData('pdf')}
                        className="py-3 px-4 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all font-bold"
                      >
                        <Download className="inline mr-2" size={18} />
                        Export PDF
                      </button>
                    </div>
                    <label className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white/10 border border-white/10 text-white font-bold hover:bg-white/20 transition-all cursor-pointer">
                      <Upload size={20} />
                      Import podatke (JSON, Excel, XML)
                      <input
                        type="file"
                        accept=".json,.xlsx,.xls,.xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) importAiTrainingData(file);
                        }}
                      />
                    </label>
                  </div>

                  {/* Training Data List */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-300">Obučeni podaci ({aiTrainingData.length})</h4>
                    {aiTrainingData.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <Brain size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg">Nema obučenih podataka</p>
                        <p className="text-sm mt-2">Dodajte nove podatke iznad ili importujte postojeće</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {aiTrainingData.map((item, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-bold text-purple-400 mb-2">Q: {item.question}</p>
                                <p className="text-sm text-slate-400">A: {item.answer}</p>
                              </div>
                              <button
                                onClick={() => {
                                  const newData = aiTrainingData.filter((_, i) => i !== idx);
                                  setAiTrainingData(newData);
                                  saveToStorage('aiTrainingData', newData);
                                  logActivity('Obrisao AI trening podatak', item.question);
                                }}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Activity & Analytics */}
      {rightSidebarOpen && (
        <div 
          className="glass-sidebar flex flex-col relative transition-all duration-300 ease-in-out z-40"
          style={{ width: `${rightSidebarWidth}px` }}
        >
          <div className="p-8 flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-2xl font-black tracking-tight">AKTIVNOSTI</h3>
            <button onClick={() => setRightSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Filters Section - At Top */}
          <div className="p-8 pt-0 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Filtriraj po datumu</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Od</label>
                  <input 
                    type="date" 
                    value={analyticsFromDate}
                    onChange={(e) => setAnalyticsFromDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white/5 border border-white/10 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Do</label>
                  <input 
                    type="date" 
                    value={analyticsToDate}
                    onChange={(e) => setAnalyticsToDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white/5 border border-white/10 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Filtriraj po statusu</h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`p-3 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === 'all' 
                      ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  SVE
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`p-3 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === 'pending' 
                      ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  NA ČEKANJU
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`p-3 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === 'completed' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  ISPLAĆENO
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => {
                  setActiveTab('overview');
                  setActiveSummaryView('suppliers');
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
              >
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Po dobavljačima</h4>
                <ChevronDown size={18} className="text-slate-500 group-hover:text-blue-400 -rotate-90" />
              </button>

              <button 
                onClick={() => {
                  setActiveTab('overview');
                  setActiveSummaryView('hotels');
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
              >
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Po hotelima</h4>
                <ChevronDown size={18} className="text-slate-500 group-hover:text-purple-400 -rotate-90" />
              </button>

              <button 
                onClick={() => {
                  setActiveTab('overview');
                  setActiveSummaryView('countries');
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
              >
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Po državama</h4>
                <ChevronDown size={18} className="text-slate-500 group-hover:text-emerald-400 -rotate-90" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <section>
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Nedavni događaji</h4>
              <div className="space-y-6">
                {activityLogs.slice(0, 15).map((log, i) => (
                  <div key={log.id} className="flex gap-4 relative">
                    {i !== activityLogs.slice(0, 15).length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-800" />
                    )}
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border flex items-center justify-center flex-shrink-0 z-10" style={{ borderColor: 'var(--border-color)' }}>
                      <Activity size={20} className="text-blue-400" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-lg font-bold leading-tight">{log.action}</p>
                      <p className="text-base text-slate-500 mt-1">{log.details}</p>
                      <p className="text-sm text-slate-600 mt-2 font-medium">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Resize Handle Right */}
          <div 
            className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors z-50"
            onMouseDown={() => setIsResizingRight(true)}
          />
        </div>
      )}

      {/* AI Assistant Floating Icon */}
      {!aiChatOpen && (
        <button
          onClick={() => setAiChatOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-2xl shadow-purple-500/50 flex items-center justify-center hover:scale-110 transition-all z-50 group"
        >
          <MessageCircle className="text-white" size={28} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* AI Assistant Chat Window */}
      {aiChatOpen && (
        <div
          className="fixed glass-card shadow-2xl border border-white/20 flex flex-col z-50"
          style={{
            left: `${aiChatX}px`,
            top: `${aiChatY}px`,
            width: `${aiChatWidth}px`,
            height: `${aiChatHeight}px`,
            minWidth: '350px',
            minHeight: '400px',
            maxWidth: '90vw',
            maxHeight: '90vh'
          }}
        >
          {/* Chat Header with Drag */}
          <div
            className="p-4 border-b border-white/10 flex items-center justify-between cursor-move bg-gradient-to-r from-purple-600/20 to-pink-600/20"
            onMouseDown={(e) => {
              setIsAiDragging(true);
              setAiDragStart({ x: e.clientX - aiChatX, y: e.clientY - aiChatY });
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Brain className="text-white" size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">AI Asistent za Isplate</h3>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-bold">
                    ✨ GEMINI
                  </span>
                </div>
                <p className="text-xs text-slate-400">Powered by Google Gemini AI</p>
              </div>
            </div>
            <button
              onClick={() => setAiChatOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiChatMessages.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Brain size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-bold mb-2">Dobrodošli u AI Asistent</p>
                <p className="text-sm">Pitajte me o isplatama, dobavljačima, hotelima ili bilo čemu drugom!</p>
                <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                  <p className="text-xs text-slate-600">Primeri pitanja:</p>
                  <div className="text-xs space-y-1 text-slate-500">
                    <p>• "Koliko je ukupno isplata?"</p>
                    <p>• "Koje isplate su na čekanju?"</p>
                    <p>• "Koliko hotela imam?"</p>
                    <p>• "Isplate danas?"</p>
                  </div>
                </div>
              </div>
            )}
            {aiChatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/10 border border-white/10'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}
            {aiIsLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-2xl bg-white/10 border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <span className="text-xs text-slate-400 ml-2">AI razmišlja...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInputMessage}
                onChange={(e) => setAiInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !aiIsLoading && handleAiSend()}
                placeholder={aiIsLoading ? "AI razmišlja..." : "Unesite pitanje..."}
                disabled={aiIsLoading}
                className="flex-1 p-3 rounded-xl modern-input text-sm disabled:opacity-50"
              />
              <button
                onClick={handleAiSend}
                disabled={aiIsLoading}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Resize Handles */}
          {/* Top Left */}
          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsAiResizing(true);
              setAiResizeDirection('nw');
            }}
          />
          {/* Top Right */}
          <div
            className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsAiResizing(true);
              setAiResizeDirection('ne');
            }}
          />
          {/* Bottom Left */}
          <div
            className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsAiResizing(true);
              setAiResizeDirection('sw');
            }}
          />
          {/* Bottom Right */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsAiResizing(true);
              setAiResizeDirection('se');
            }}
          />
          {/* Top */}
          <div
            className="absolute top-0 left-4 right-4 h-2 cursor-ns-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsAiResizing(true);
              setAiResizeDirection('n');
            }}
          />
          {/* Bottom */}
          <div
            className="absolute bottom-0 left-4 right-4 h-2 cursor-ns-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsAiResizing(true);
              setAiResizeDirection('s');
            }}
          />
          {/* Left */}
          <div
            className="absolute left-0 top-4 bottom-4 w-2 cursor-ew-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsAiResizing(true);
              setAiResizeDirection('w');
            }}
          />
          {/* Right */}
          <div
            className="absolute right-0 top-4 bottom-4 w-2 cursor-ew-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsAiResizing(true);
              setAiResizeDirection('e');
            }}
          />
        </div>
      )}
    </div>
  );
}


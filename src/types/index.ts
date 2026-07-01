// src/types/index.ts
export interface User {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  studentNumber?: string;
  phoneNumber?: string;
  campusResidence?: string;
  bio?: string;
  // Student specific
  course?: string;
  yearOfStudy?: string;
  // Staff specific
  staffId?: string;
  department?: string;
  position?: string;
  // Vendor specific
  businessName?: string;
  businessType?: string;
  businessDescription?: string;
  businessAddress?: string;
  // Community specific
  communityType?: string;
  profilePhoto?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  quantity: number;
  category: string;
  condition: string;
  description: string;
  seller: {
    id: string;
    name: string;
    email: string;
  };
  images: string[];
  rating: number;
  stock: number;
  createdAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Post {
  id: string;
  type: PostType;
  title: string;
  description: string;
  category: string;
  price?: string;
  schedule?: string;
  venue?: string;
  postedBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export type PostType = 'General' | 'Event' | 'Service' | 'Lost & Found';

export interface Order {
  id?: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt?: string;
}

export type PaymentMethod = 'Card' | 'EFT' | 'PayFast';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, role?: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  getTotal: () => number;
}

export interface ThemeContextType {
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    textLight: string;
    border: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    h1: { fontSize: number; fontWeight: string };
    h2: { fontSize: number; fontWeight: string };
    h3: { fontSize: number; fontWeight: string };
    body: { fontSize: number; fontWeight: string };
    small: { fontSize: number; fontWeight: string };
    caption: { fontSize: number; fontWeight: string };
  };
  borderRadius: {
    pill: number;
    card: number;
    button: number;
    input: number;
  };
}
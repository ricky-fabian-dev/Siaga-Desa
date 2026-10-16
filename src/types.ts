export type UserRole = 'warga' | 'relawan' | 'perangkat_desa' | 'admin';

export type EmergencyType = 'medis' | 'kebakaran' | 'bencana' | 'keamanan' | 'lainnya';

export type SosStatus = 'menunggu' | 'proses' | 'selesai' | 'dibatalkan';

export interface UserProfile {
  displayName: string;
  callSign: string; // nama panggilan pembeda unik (misal: "Pak Budi RT 02")
  phoneNumber: string;
  address: string;
  rtRw?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  role: UserRole;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminRecord {
  email: string;
  role: 'relawan' | 'perangkat_desa' | 'admin';
  name?: string;
  addedAt?: string;
}

export interface SosAlert {
  id?: string;
  userId: string;
  userName: string;
  userCallSign: string;
  userPhone: string;
  emergencyType: EmergencyType;
  description?: string;
  address?: string;
  rtRw?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  status: SosStatus;
  handledByUserId?: string;
  handledByName?: string;
  handledAt?: string;
  resolvedNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VillageContact {
  id?: string;
  title: string;
  phone: string;
  category?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

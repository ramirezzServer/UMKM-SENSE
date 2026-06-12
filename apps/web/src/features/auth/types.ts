export interface AuthBusiness {
  id: string;
  name: string;
  category: string;
  district: string;
  district_lat: number | null;
  district_lng: number | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  email_verified_at: string | null;
  business: AuthBusiness | null;
}

export interface District {
  id: number;
  name: string;
  city: string;
  province: string;
}

export type NeedSeverity = 'low' | 'medium' | 'high' | 'critical';
export type NeedStatus = 'open' | 'assigned' | 'resolved';
export type NeedType = 'food' | 'medical' | 'shelter' | 'water' | 'other';

export interface CommunityNeed {
  id: string;
  raw_message: string;
  location: string;
  lat: number;
  lng: number;
  need_type: NeedType;
  severity: NeedSeverity;
  affected_count: number;
  status: NeedStatus;
  assigned_volunteer_id?: string;
  created_at: number;
  source_phone: string;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  skills: NeedType[];
  ward: string;
  lat: number;
  lng: number;
  available: boolean;
  registered_at: number;
  bio?: string;
  assignmentCount?: number;
  rating?: number;
  languages?: string[];
}

export interface NeedExtraction {
  location: string;
  need_type: NeedType;
  severity: NeedSeverity;
  affected_count: number;
}

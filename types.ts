
export interface BrandColors {
  primary: string;
  secondary: string;
}

export interface BrandLogo {
  title: string;
  favicon: string;
}

export interface BrandChatbot {
  avatar: string;
  face: string;
}

export interface BrandSocialMedia {
  blog: string;
  linkedin: string;
  instagram: string;
  github: string;
  x: string;
  youtube: string;
}

export interface BrandConfig {
  shortName: string;
  longName: string;
  website: string;
  email: string;
  mobile: string;
  slogan: string;
  colors: BrandColors;
  logo: BrandLogo;
  chatbot: BrandChatbot;
  socialMedia: BrandSocialMedia;
}

export interface AppBranding {
  brand: BrandConfig;
}

export interface Transaction {
  transaction_id: string;
  date: string;
  amount: number;
  category: string;
  account: string;
  vendor: string;
  [key: string]: string | number; // To allow for other columns
}

export enum AnomalyStatus {
  Normal = "Normal",
  Suspicious = "Suspicious",
  Anomalous = "Anomalous",
  All = "All"
}

export interface ProcessedTransaction extends Transaction {
  anomaly_score: number;
  anomaly_status: AnomalyStatus;
  reason: string;
}

export interface ChartDataItem {
  name: string;
  value: number;
}

export interface CategoryAnomalyRate extends ChartDataItem {
  total: number;
  anomalies: number;
}

export interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
}

export interface Filters {
  dateRange: DateRange;
  account: string;
  category: string;
  status: AnomalyStatus;
  searchTerm: string;
}

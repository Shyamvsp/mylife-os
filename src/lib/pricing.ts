export type PricingConfig = {
  monthly_price: number;
  three_month_price: number;
  three_month_original_price: number;
  three_month_discount_tag: string;
  trial_days: number;
  upi_id: string;
  payee_name: string;
  promo_active: boolean;
  promo_text: string;
};

export const DEFAULT_PRICING: PricingConfig = {
  monthly_price: 29,
  three_month_price: 59,
  three_month_original_price: 87,
  three_month_discount_tag: "Save ₹28 (32% OFF)",
  trial_days: 7,
  upi_id: "dasapallivenkatshyamprasad-1@okaxis",
  payee_name: "Venkat Shyam Prasad",
  promo_active: true,
  promo_text: "🔥 Special Discount: 3 Months for only ₹59 instead of ₹87!",
};

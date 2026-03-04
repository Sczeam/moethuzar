type PromoStatusBannerProps = {
  statusText: string;
};

export function PromoStatusBanner({ statusText }: PromoStatusBannerProps) {
  if (!statusText) {
    return null;
  }

  return <p className="text-sm text-charcoal">{statusText}</p>;
}

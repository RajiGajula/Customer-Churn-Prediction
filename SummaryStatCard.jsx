function SummaryStatCard({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
}) {
  return (
    <article className={className}>
      <span className={labelClassName}>{label}</span>
      <strong className={valueClassName}>{value}</strong>
    </article>
  );
}

export default SummaryStatCard;

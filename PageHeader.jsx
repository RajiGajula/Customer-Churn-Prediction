function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
  titleClassName,
  iconClassName,
  actionsClassName,
}) {
  return (
    <header className={className}>
      <div className={titleClassName}>
        <div className={iconClassName}>{icon}</div>
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      {actions && <div className={actionsClassName}>{actions}</div>}
    </header>
  );
}

export default PageHeader;

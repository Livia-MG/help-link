const logoSources = {
  default: "/icone-help-link.svg",
  bg: "/icone-help-link-fundo.svg",
};

export const IconeLogo = ({
  className = "h-9 w-9 object-contain",
  variant = "default",
  withBg,
  alt = "Help Link",
  ...props
}) => {
  const resolvedVariant = withBg ? "bg" : variant;
  const src = logoSources[resolvedVariant] ?? logoSources.default;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
      {...props}
    />
  );
};

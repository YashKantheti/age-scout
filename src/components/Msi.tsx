interface MsiProps {
  icon: string;
  fill?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Msi({ icon, fill = false, className = '', style }: MsiProps) {
  return (
    <span
      className={`msi ${className}`}
      style={{
        fontVariationSettings: fill
          ? "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24"
          : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
        ...style,
      }}
    >
      {icon}
    </span>
  );
}

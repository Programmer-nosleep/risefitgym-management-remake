import logoLight from "@/assets/img/rise_fit_logo.png"
import logoDark from "@/assets/img/rise_fit_logo_black.png"
import { cn } from "@/lib/utils"

export type BrandLogoProps = {
  className?: string
  variant?: "light" | "dark"
}

export default function BrandLogo({ className, variant = "light" }: BrandLogoProps) {
  const src = variant === "dark" ? logoDark : logoLight

  return (
    <img
      src={src}
      alt="RiseFit"
      className={cn("h-9 w-auto select-none", className)}
      draggable={false}
    />
  )
}


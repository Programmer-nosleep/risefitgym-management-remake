export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t pt-6 text-center">
      <p className="text-muted-foreground text-xs">
        © {year} RiseFit System Management. All rights reserved.
      </p>
    </footer>
  )
}

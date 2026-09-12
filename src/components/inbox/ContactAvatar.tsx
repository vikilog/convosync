import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function ContactAvatar({
  name,
  src,
  className,
}: {
  name: string
  src?: string | null
  className?: string
}) {
  return (
    <Avatar className={className}>
      {src ? <AvatarImage src={src} alt={name} referrerPolicy="no-referrer" /> : null}
      <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}

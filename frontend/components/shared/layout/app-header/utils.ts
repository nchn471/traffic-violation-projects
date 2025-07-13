export function getInitials(name: string) {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
}
  
export function getRoleColor(role: string): string {
    switch (role.toLowerCase()) {
      case "admin":
        return "text-rose-600 dark:text-rose-400"        
      case "officer":
        return "text-sky-600 dark:text-sky-400"           
      default:
        return "text-muted-foreground"                    
    }
  }
export function getAvatarUrl(seed: string): string {
    const style = 'initials'
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`
  }
  
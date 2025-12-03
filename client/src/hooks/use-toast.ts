// Simple toast hook using native browser notifications
export function useToast() {
  const toast = ({ title, description }: { title: string; description: string }) => {
    // For now, use alert - in production this would use a proper toast library
    console.log(`[Toast] ${title}: ${description}`);
    // Could integrate with shadcn/ui toast component here
  };

  return { toast };
}

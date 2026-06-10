import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    'Submitted': 'bg-blue-100 text-blue-800',
    'Acknowledged': 'bg-cyan-100 text-cyan-800',
    'Under Review': 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-orange-100 text-orange-800',
    'Awaiting Confirmation': 'bg-purple-100 text-purple-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Closed': 'bg-gray-100 text-gray-800',
    'Rejected': 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

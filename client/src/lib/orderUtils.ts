/**
 * Utility functions for order management
 */

/**
 * Get the color classes for order status badges
 * @param status - The order status
 * @returns Tailwind CSS classes for the badge background and text color
 */
export function getOrderStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "received":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

/**
 * Get a formatted display name for order status
 * @param status - The order status
 * @returns Capitalized status name
 */
export function getOrderStatusDisplay(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

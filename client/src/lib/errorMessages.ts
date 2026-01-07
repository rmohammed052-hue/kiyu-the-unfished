/**
 * User-friendly error message mappings
 * 
 * This module provides human-readable error messages for common API errors.
 * These messages are designed to be helpful and actionable for end users.
 */

// Map of technical error messages to user-friendly messages
export const errorMessages: Record<string, string> = {
  // Authentication errors
  "Invalid credentials": "The email or password you entered is incorrect. Please try again.",
  "Authentication required": "Please sign in to continue.",
  "Invalid or expired token": "Your session has expired. Please sign in again.",
  "Account is inactive": "Your account has been deactivated. Please contact support for assistance.",
  "Account pending approval": "Your account is still being reviewed. We'll notify you once it's approved.",
  "Insufficient permissions": "You don't have permission to perform this action.",
  "Admin access required": "This area is restricted to administrators only.",
  "No permissions configured for this admin": "Your admin account hasn't been configured with permissions yet. Please contact the super administrator.",
  "Insufficient permissions for this action": "You don't have the necessary permissions for this action.",
  "Cannot self-register as admin": "Admin accounts can only be created by existing administrators.",
  
  // User management errors
  "Email already exists": "This email is already registered. Please use a different email or sign in.",
  "User not found": "We couldn't find this user. They may have been removed.",
  "Current password is incorrect": "The current password you entered is wrong. Please try again.",
  "Password validation failed": "Your new password doesn't meet security requirements. Please use at least 8 characters with a mix of letters and numbers.",
  
  // Product errors
  "Product not found": "This product is no longer available.",
  "Insufficient stock": "Sorry, there isn't enough stock available for your order.",
  "Product is inactive": "This product is currently unavailable.",
  
  // Order errors
  "Order not found": "We couldn't find this order. Please check the order number.",
  "Order already cancelled": "This order has already been cancelled.",
  "Cannot cancel delivered order": "Sorry, you can't cancel an order that's already been delivered.",
  "Order status cannot be changed": "The order status cannot be changed at this time.",
  
  // Cart errors
  "Cart is empty": "Your cart is empty. Add some items before checkout.",
  "Item not in cart": "This item is not in your cart.",
  
  // Store errors
  "Store not found": "This store doesn't exist or has been removed.",
  "Store is inactive": "This store is currently unavailable.",
  "Already has a store": "You already have a store registered.",
  
  // Payment errors
  "Payment failed": "Your payment couldn't be processed. Please try again or use a different payment method.",
  "Payment verification failed": "We couldn't verify your payment. Please contact support if you were charged.",
  "Invalid payment reference": "The payment reference is invalid. Please try again.",
  
  // Delivery errors
  "Delivery zone not found": "We don't currently deliver to this location.",
  "No riders available": "No riders are available for delivery at the moment. Please try again later.",
  "Rider not found": "This rider is no longer available.",
  
  // File upload errors
  "File too large": "The file is too large. Please upload a smaller file.",
  "Invalid file type": "This file type isn't supported. Please use a different format.",
  "Upload failed": "The file couldn't be uploaded. Please try again.",
  
  // Generic errors
  "Network error": "Unable to connect to the server. Please check your internet connection.",
  "Server error": "Something went wrong on our end. Please try again later.",
  "Request timeout": "The request took too long. Please try again.",
  "Rate limited": "You're making too many requests. Please wait a moment and try again.",
};

/**
 * Get a user-friendly error message from a technical error
 */
export function getUserFriendlyError(error: string | Error): string {
  const errorString = error instanceof Error ? error.message : error;
  
  // Check for exact match
  if (errorMessages[errorString]) {
    return errorMessages[errorString];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(errorMessages)) {
    if (errorString.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Handle HTTP status codes in error messages (e.g., "401: Invalid credentials")
  const statusCodeMatch = errorString.match(/^(\d{3}):\s*(.+)$/);
  if (statusCodeMatch) {
    const [, statusCode, message] = statusCodeMatch;
    const cleanMessage = message.replace(/[{}"]/g, '').trim();
    
    // Try to find a match for the message without status code
    if (errorMessages[cleanMessage]) {
      return errorMessages[cleanMessage];
    }
    
    // Handle common status codes
    switch (statusCode) {
      case "400":
        return cleanMessage || "The information you provided is invalid. Please check and try again.";
      case "401":
        return cleanMessage || "Please sign in to continue.";
      case "403":
        return cleanMessage || "You don't have permission to access this.";
      case "404":
        return cleanMessage || "The page or item you're looking for doesn't exist.";
      case "409":
        return cleanMessage || "This action conflicts with existing data.";
      case "429":
        return "You're making too many requests. Please wait a moment and try again.";
      case "500":
        return "Something went wrong on our end. Please try again later.";
      case "502":
      case "503":
      case "504":
        return "The server is temporarily unavailable. Please try again in a few moments.";
    }
  }
  
  // Handle JSON parse errors
  if (errorString.includes("JSON")) {
    return "We received an unexpected response. Please try again.";
  }
  
  // Handle network errors
  if (errorString.includes("network") || errorString.includes("fetch") || errorString.includes("NetworkError")) {
    return "Unable to connect to the server. Please check your internet connection.";
  }
  
  // Return a generic message for unknown errors
  return "Something went wrong. Please try again or contact support if the problem persists.";
}

/**
 * Format an error for display in a toast notification
 */
export function formatErrorForToast(error: unknown): { title: string; description: string } {
  if (error instanceof Error) {
    return {
      title: "Error",
      description: getUserFriendlyError(error),
    };
  }
  
  if (typeof error === "string") {
    return {
      title: "Error",
      description: getUserFriendlyError(error),
    };
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return {
      title: "Error",
      description: getUserFriendlyError(String((error as { message: string }).message)),
    };
  }
  
  return {
    title: "Error",
    description: "Something went wrong. Please try again.",
  };
}

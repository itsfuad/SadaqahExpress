import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to unified login page
    setLocation("/login");
  }, [setLocation]);

  return null;
}

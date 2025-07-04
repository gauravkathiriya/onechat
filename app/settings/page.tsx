'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/auth-provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ArrowLeft, Sun, Moon, Bell, BellOff, Lock, Trash2, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const { supabase, user, isLoading } = useSupabase();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    soundEffects: true,
    readReceipts: true,
    onlineStatus: true,
    typingIndicators: true
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    toast.success(`${setting.charAt(0).toUpperCase() + setting.slice(1)} ${settings[setting] ? 'disabled' : 'enabled'}`);
  };

  const handleDeleteAccount = async () => {
    try {
      // Here you would implement the actual account deletion logic
      // This is just a placeholder
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Account deleted successfully');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-muted rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded mb-3"></div>
          <div className="h-3 w-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <ThemeToggle />
        </div>
        
        <h1 className="text-3xl font-bold mb-8 text-blue-700 dark:text-blue-400">Settings</h1>
        
        <div className="space-y-6">
          {/* Appearance */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-blue-600 dark:text-blue-400">Appearance</CardTitle>
              <CardDescription>
                Customize how OneChat looks for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                  <span>Theme Mode</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    className={`px-3 py-1 rounded-md ${theme === 'light' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
                    onClick={() => setTheme('light')}
                  >
                    Light
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-md ${theme === 'dark' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                    onClick={() => setTheme('dark')}
                  >
                    Dark
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-md ${theme === 'system' ? 'bg-blue-100 text-blue-600 dark:bg-blue-600 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
                    onClick={() => setTheme('system')}
                  >
                    System
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-blue-600 dark:text-blue-400">Notifications</CardTitle>
              <CardDescription>
                Configure how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.notifications ? (
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <BellOff className="h-5 w-5 text-gray-400" />
                  )}
                  <span>Enable notifications</span>
                </div>
                <Switch 
                  checked={settings.notifications} 
                  onCheckedChange={() => handleSettingChange('notifications')}
                  className={settings.notifications ? "bg-blue-600" : ""} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="ml-7">Sound effects</span>
                </div>
                <Switch 
                  checked={settings.soundEffects} 
                  onCheckedChange={() => handleSettingChange('soundEffects')}
                  disabled={!settings.notifications}
                  className={settings.soundEffects && settings.notifications ? "bg-blue-600" : ""} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-blue-600 dark:text-blue-400">Privacy</CardTitle>
              <CardDescription>
                Control your privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span>Read receipts</span>
                </div>
                <Switch 
                  checked={settings.readReceipts} 
                  onCheckedChange={() => handleSettingChange('readReceipts')}
                  className={settings.readReceipts ? "bg-blue-600" : ""} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span>Show online status</span>
                </div>
                <Switch 
                  checked={settings.onlineStatus} 
                  onCheckedChange={() => handleSettingChange('onlineStatus')}
                  className={settings.onlineStatus ? "bg-blue-600" : ""} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span>Show typing indicators</span>
                </div>
                <Switch 
                  checked={settings.typingIndicators} 
                  onCheckedChange={() => handleSettingChange('typingIndicators')}
                  className={settings.typingIndicators ? "bg-blue-600" : ""} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-blue-600 dark:text-blue-400">Account</CardTitle>
              <CardDescription>
                Manage your account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/profile">
                <Button variant="outline" className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-gray-800">
                  Edit Profile
                </Button>
              </Link>
              
              <Button variant="outline" className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-gray-800">
                Change Password
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => handleSignOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
              
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete your account?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:justify-start">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
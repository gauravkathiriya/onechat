'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSupabase } from '@/lib/auth-provider';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Camera, User, Upload } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  avatarUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSetupPage() {
  const { supabase, user } = useSupabase();
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      avatarUrl: '',
    }
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;
    
    setIsUploading(true);
    
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `avatars/${user.id}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, avatarFile, { upsert: true });
        
      if (error) {
        toast.error('Error uploading avatar');
        return null;
      }
      
      const { data } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      
      let avatarUrl = '';
      
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }
      
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: data.displayName,
          avatar_url: avatarUrl,
          has_completed_profile: true,
        }
      });
      
      if (error) throw error;
      
      toast.success('Profile setup completed');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">One</span>
          <span className="text-3xl font-bold">Chat</span>
        </div>
        <p className="text-muted-foreground">Complete your profile to get started</p>
      </div>
      
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Help others recognize you with a name and picture
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-600 text-white text-2xl">
                    {user?.email?.charAt(0).toUpperCase() || <User size={32} />}
                  </AvatarFallback>
                </Avatar>
                
                <Label 
                  htmlFor="avatar" 
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                  <div className="flex flex-col items-center text-white">
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-xs">Upload photo</span>
                  </div>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />
                </Label>
              </div>
              
              {avatarFile && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  {avatarFile.name}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Display Name
              </Label>
              <Input
                id="displayName"
                placeholder="How would you like to be called?"
                {...register('displayName')}
                className="h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
              />
              {errors.displayName && (
                <p className="text-sm text-red-500">{errors.displayName.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This is the name that will be visible to others in chats
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700" 
              disabled={isSubmitting || isUploading}
              size="lg"
            >
              {isSubmitting || isUploading ? 'Saving...' : 'Complete Setup'}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              You can always update your profile later from settings
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 
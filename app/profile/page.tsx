'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Camera, User, Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  avatarUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { supabase, user, isLoading } = useSupabase();
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      avatarUrl: '',
    }
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      // Set form values from user data
      setValue('displayName', user.user_metadata?.display_name || '');
      setAvatarPreview(user.user_metadata?.avatar_url || '');
    }
  }, [isLoading, user, router, setValue]);

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
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Delete any existing avatar with the same name pattern first
      try {
        const { data: existingFiles } = await supabase
          .storage
          .from('user-avatars')
          .list('avatars', {
            search: user.id
          });
          
        if (existingFiles && existingFiles.length > 0) {
          await supabase
            .storage
            .from('user-avatars')
            .remove(existingFiles.map(file => `avatars/${file.name}`));
        }
      } catch (error) {
        console.log('No existing avatar or error listing files', error);
      }
      
      // Upload the new avatar
      const { error } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, avatarFile, {
          upsert: true,
          contentType: avatarFile.type
        });
        
      if (error) {
        console.error('Upload error:', error);
        toast.error('Error uploading avatar: ' + error.message);
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
      
      let avatarUrl = user.user_metadata?.avatar_url || '';
      
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
        }
      });
      
      if (error) throw error;
      
      toast.success('Profile updated successfully');
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
        
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-blue-700 dark:text-blue-400">Your Profile</CardTitle>
            <CardDescription className="text-center">
              Update your profile information
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
                      <span className="text-xs">Change photo</span>
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
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="h-11 bg-gray-50 dark:bg-gray-800"
                />
                <p className="text-xs text-muted-foreground">
                  Your email address cannot be changed
                </p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="displayName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
              >
                {isSubmitting || isUploading ? 'Saving...' : 'Update Profile'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 
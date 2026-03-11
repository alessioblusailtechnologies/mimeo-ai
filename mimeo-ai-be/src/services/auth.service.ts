import { supabaseClient, supabaseAdmin } from '../config/supabase.js';
import { BadRequestError } from '../utils/api-error.js';
import type { RegisterDto, LoginDto, UpdateProfileDto, Profile } from '../types/auth.types.js';

export async function register(dto: RegisterDto) {
  const { data, error } = await supabaseClient.auth.signUp({
    email: dto.email,
    password: dto.password,
    options: {
      data: { full_name: dto.full_name },
    },
  });

  if (error) throw new BadRequestError(error.message);
  return data;
}

export async function login(dto: LoginDto) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: dto.email,
    password: dto.password,
  });

  if (error) throw new BadRequestError(error.message);
  return data;
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Profile doesn't exist yet — create it on the fly
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('mimeo_profiles')
      .insert({ id: userId })
      .select()
      .single();

    if (insertError) throw insertError;
    return newProfile as Profile;
  }

  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, dto: UpdateProfileDto): Promise<Profile> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_profiles')
    .update(dto)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

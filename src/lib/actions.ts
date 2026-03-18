'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { RoleCode } from '@prisma/client';
import { z } from 'zod';
import { login, logout, requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) return { error: 'Enter a valid email and password.' };

  const session = await login(parsed.data.email, parsed.data.password);
  if (!session) return { error: 'Invalid credentials.' };

  redirect('/dashboard');
}

export async function logoutAction() {
  await logout();
  redirect('/login');
}

const customerSchema = z.object({
  id: z.coerce.number().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  remarks: z.string().optional(),
  salesExecutiveId: z.coerce.number().int().positive(),
});

export async function saveCustomerAction(_prev: { error?: string } | undefined, formData: FormData) {
  const session = await requireRole([RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.SALES_EXECUTIVE]);
  const parsed = customerSchema.safeParse({
    id: formData.get('id') || undefined,
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    city: formData.get('city') || '',
    state: formData.get('state') || '',
    country: formData.get('country') || '',
    remarks: formData.get('remarks') || '',
    salesExecutiveId: formData.get('salesExecutiveId'),
  });

  if (!parsed.success) return { error: 'Please complete required customer fields.' };

  if (session.role === RoleCode.SALES_EXECUTIVE && session.id !== parsed.data.salesExecutiveId) {
    return { error: 'Sales Executives can only assign customers to themselves.' };
  }

  const payload = {
    salesExecutiveId: parsed.data.salesExecutiveId,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    city: parsed.data.city || null,
    state: parsed.data.state || null,
    country: parsed.data.country || null,
    remarks: parsed.data.remarks || null,
  };

  if (parsed.data.id) {
    await prisma.customer.update({ where: { id: parsed.data.id }, data: payload });
  } else {
    await prisma.customer.create({ data: payload });
  }

  revalidatePath('/customers');
  redirect('/customers');
}

const brandSchema = z.object({
  name: z.string().min(1),
});

export async function createBrandAction(_prev: { error?: string } | undefined, formData: FormData) {
  await requireRole([RoleCode.ADMIN, RoleCode.MANAGER]);
  const parsed = brandSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return { error: 'Brand name is required.' };

  const slug = slugify(parsed.data.name);
  await prisma.brand.upsert({
    where: { slug },
    update: { name: parsed.data.name, isActive: true },
    create: { name: parsed.data.name, slug },
  });

  revalidatePath('/catalog/brands');
  redirect('/catalog/brands');
}

const modelSchema = z.object({
  brandId: z.coerce.number().int().positive(),
  name: z.string().min(1),
});

export async function createModelAction(_prev: { error?: string } | undefined, formData: FormData) {
  await requireRole([RoleCode.ADMIN, RoleCode.MANAGER]);
  const parsed = modelSchema.safeParse({
    brandId: formData.get('brandId'),
    name: formData.get('name'),
  });
  if (!parsed.success) return { error: 'Select a brand and enter a model name.' };

  await prisma.model.upsert({
    where: {
      brandId_name: {
        brandId: parsed.data.brandId,
        name: parsed.data.name,
      },
    },
    update: { isActive: true },
    create: {
      brandId: parsed.data.brandId,
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
    },
  });

  revalidatePath('/catalog/models');
  redirect('/catalog/models');
}

export async function getDashboardStats() {
  const session = await requireAuth();

  const [customerCount, requirementCount, brandCount, modelCount] = await Promise.all([
    prisma.customer.count({
      where: session.role === RoleCode.SALES_EXECUTIVE ? { salesExecutiveId: session.id } : undefined,
    }),
    prisma.requirement.count({
      where: session.role === RoleCode.SALES_EXECUTIVE ? { salesExecutiveId: session.id } : undefined,
    }),
    prisma.brand.count({ where: { isActive: true } }),
    prisma.model.count({ where: { isActive: true } }),
  ]);

  return { session, customerCount, requirementCount, brandCount, modelCount };
}

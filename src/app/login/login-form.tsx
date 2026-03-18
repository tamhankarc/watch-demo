'use client';

import { useActionState } from 'react';
import { loginAction } from '@/lib/actions';
import { FormMessage } from '@/components/form-message';

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="form">
      <label className="label">
        <span>Email</span>
        <input className="input" name="email" type="email" placeholder="you@example.com" required />
      </label>
      <label className="label">
        <span>Password</span>
        <input className="input" name="password" type="password" placeholder="••••••••" required />
      </label>
      <FormMessage error={state.error} />
      <button className="button" type="submit" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}

'use client';

import {
  Navbar as NextUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from '@nextui-org/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'aws-amplify/auth';

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, isLoading, username } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <NextUINavbar className="bg-brand-beige border-b border-brand-brown/20" maxWidth="full">
      <NavbarBrand>
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="The Story Hub"
            width={50}
            height={50}
            className="rounded-lg"
          />
          <span className="font-bold text-xl text-brand-purple">The Story Hub</span>
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-6" justify="center">
        <NavbarItem>
          <Link href="/browse" className="text-brand-purple hover:text-brand-orange transition-colors">
            Browse Stories
          </Link>
        </NavbarItem>
        {isAuthenticated && (
          <NavbarItem>
            <Link href="/story/create" className="text-brand-purple hover:text-brand-orange transition-colors">
              Create Story
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent justify="end">
        {isLoading ? (
          <NavbarItem>
            <Button size="sm" variant="light" isLoading />
          </NavbarItem>
        ) : isAuthenticated ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                className="transition-transform bg-brand-purple text-white"
                name={username}
                size="sm"
                showFallback
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold text-brand-purple">{username}</p>
              </DropdownItem>
              <DropdownItem key="my-stories" onClick={() => router.push('/my-stories')}>
                My Stories
              </DropdownItem>
              <DropdownItem key="bookmarks" onClick={() => router.push('/bookmarks')}>
                Bookmarks
              </DropdownItem>
              <DropdownItem key="settings" onClick={() => router.push('/settings')}>
                Settings
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onClick={handleLogout}>
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <NavbarItem>
            <Button
              as={Link}
              href="/login"
              color="primary"
              variant="flat"
              size="sm"
            >
              Sign In
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>
    </NextUINavbar>
  );
}

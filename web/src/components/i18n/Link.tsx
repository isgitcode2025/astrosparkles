"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useHref } from "./LangProvider";

type Props = Omit<ComponentProps<typeof NextLink>, "href"> & { href: string };

/**
 * next/link that keeps the reader in their language: "/panchang" becomes
 * "/hi/panchang" while Hindi is active. Use it for every internal link.
 */
export function Link({ href, ...rest }: Props) {
  return <NextLink href={useHref()(href)} {...rest} />;
}

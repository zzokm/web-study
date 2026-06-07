"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookmarkIcon,
  BrainIcon,
  CodeIcon,
  FileTextIcon,
  GraduationCapIcon,
  HomeIcon,
  MonitorIcon,
  PresentationIcon,
  MessageSquareIcon,
  RepeatIcon,
  ServerIcon,
} from "lucide-react";
import {
  FEEDBACK_FORM_TOOLTIP,
  FEEDBACK_FORM_URL,
  GITHUB_PROFILE_URL,
  GITHUB_REPO_URL,
} from "@/lib/site-links";
import { ExamCountdown } from "@/components/layout/exam-countdown";
import { ExamPostCelebration } from "@/components/layout/exam-post-celebration";
import { PageBreadcrumbs } from "@/components/layout/page-breadcrumbs";
import {
  PracticeHeaderShortcuts,
  PracticeHeaderTimer,
} from "@/components/layout/practice-header-extras";
import { PracticeHeaderProvider } from "@/components/practice/practice-header-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { GitHubIcon } from "@/components/icons/github-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = { href: string; label: string; icon: LucideIcon };

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Home",
    items: [{ href: "/", label: "Home", icon: HomeIcon }],
  },
  {
    label: "Materials",
    items: [
      { href: "/exams/", label: "Exam files", icon: FileTextIcon },
      { href: "/lectures/frontend/", label: "Frontend lectures", icon: MonitorIcon },
      { href: "/lectures/backend/", label: "Backend lectures", icon: ServerIcon },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/practice/", label: "Practice", icon: BrainIcon },
      { href: "/by-lecture/", label: "By lecture", icon: PresentationIcon },
      { href: "/by-exam/", label: "By exam", icon: GraduationCapIcon },
      { href: "/repetitive/", label: "Repetitive", icon: RepeatIcon },
      { href: "/saved/", label: "Saved", icon: BookmarkIcon },
    ],
  },
  {
    label: "Analysis",
    items: [{ href: "/analysis/", label: "Exam analysis", icon: CodeIcon }],
  },
];

function isNavActive(pathname: string, href: string): boolean {
  const path = href.replace(/\/$/, "") || "/";
  if (path === "/") return pathname === "/" || pathname === "";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="app-shell-header shrink-0 flex-row items-center gap-0 border-b border-sidebar-border p-0 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <GraduationCapIcon className="size-5 shrink-0" />
            <span>Web Study</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="sidebar-scroll pt-0">
          <div className="flex flex-col justify-end px-2 pt-3 pb-1">
            <ExamCountdown className="mx-0" />
          </div>
          {navSections.map((section, index) => (
            <SidebarGroup
              key={section.label}
              className={index === 0 ? "pt-0" : undefined}
            >
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isNavActive(pathname, item.href)}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
          <SidebarGroup>
            <SidebarGroupLabel>Feedback</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <SidebarMenuButton
                          render={
                            <a
                              href={FEEDBACK_FORM_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        />
                      }
                    >
                      <MessageSquareIcon />
                      <span>
                        Feedback <span aria-hidden="true">⭐</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      {FEEDBACK_FORM_TOOLTIP}
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <a
                        href={GITHUB_REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <GitHubIcon />
                    <span>GitHub repository</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="mt-auto border-t border-sidebar-border px-4 py-3">
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground/80 transition-colors hover:text-muted-foreground"
          >
            <GitHubIcon />
            <span>Made By Yehia</span>
          </a>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="app-shell-header sticky top-0 z-40 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger />
            <Suspense fallback={null}>
              <PageBreadcrumbs className="min-w-0 flex-1" />
            </Suspense>
          </div>
          <PracticeHeaderTimer />
          <div className="flex items-center justify-end">
            <PracticeHeaderShortcuts />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <ExamPostCelebration />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <PracticeHeaderProvider>
        <AppShellInner>{children}</AppShellInner>
      </PracticeHeaderProvider>
    </TooltipProvider>
  );
}

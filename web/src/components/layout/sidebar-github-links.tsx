"use client";

import { GitHubIcon } from "@/components/icons/github-icon";
import { OutboundTrackedLink } from "@/components/analytics/outbound-tracked-link";
import {
  GITHUB_FOLLOW_TOOLTIP,
  GITHUB_PROFILE_URL,
  GITHUB_REPO_URL,
} from "@/lib/site-links";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarGithubLinks() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Github Links</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <OutboundTrackedLink
                  href={GITHUB_REPO_URL}
                  outboundLabel="GitHub repository"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <GitHubIcon />
              <span>GitHub repository</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger
                render={
                  <SidebarMenuButton
                    render={
                      <OutboundTrackedLink
                        href={GITHUB_PROFILE_URL}
                        outboundLabel="GitHub profile"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  />
                }
              >
                <GitHubIcon />
                <span>@zzokm</span>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                {GITHUB_FOLLOW_TOOLTIP}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Users,
  Terminal,
  Clock,
  Wifi,
  WifiOff,
  ArrowRight,
  Radio,
  Settings,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // Placeholder stats - will be replaced with real data in Phase 4A
  const stats = [
    {
      title: "Total Messages",
      value: "0",
      description: "Messages sent and received",
      icon: MessageSquare,
    },
    {
      title: "Active Users",
      value: "0",
      description: "Users interacting with bot",
      icon: Users,
    },
    {
      title: "Commands Executed",
      value: "0",
      description: "Total commands run",
      icon: Terminal,
    },
    {
      title: "Uptime",
      value: "0h 0m",
      description: "Bot running time",
      icon: Clock,
    },
  ];

  const quickActions = [
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Users", href: "/users", icon: Users },
    { label: "Broadcast", href: "/broadcast", icon: Radio },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your WhatsApp bot activity and statistics.
        </p>
      </div>

      {/* Connection status card */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
              <WifiOff className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold">Bot Status</h3>
              <p className="text-sm text-muted-foreground">
                Not connected. Scan the QR code to connect.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-red-500 text-red-500">
            Disconnected
          </Badge>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions and activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto justify-start gap-3 p-4"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="h-5 w-5" />
                  <span>{action.label}</span>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest bot activity and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No recent activity
              </p>
              <p className="text-xs text-muted-foreground">
                Activity will appear here once the bot is connected
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting started guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to set up your WhatsApp bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <div>
                <h4 className="font-medium">Connect your WhatsApp</h4>
                <p className="text-sm text-muted-foreground">
                  Scan the QR code with your WhatsApp mobile app to connect the bot.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                2
              </div>
              <div>
                <h4 className="font-medium">Configure settings</h4>
                <p className="text-sm text-muted-foreground">
                  Customize your bot&apos;s behavior, commands, and response settings.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                3
              </div>
              <div>
                <h4 className="font-medium">Start messaging</h4>
                <p className="text-sm text-muted-foreground">
                  Your bot is ready! Users can now interact with it on WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

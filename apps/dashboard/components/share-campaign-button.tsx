"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import {
  Share2,
  Link2,
  MessageCircle,
  Send,
  Twitter,
  Check,
} from "lucide-react";

interface ShareCampaignButtonProps {
  campaignId: string;
  campaignTitle: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

export function ShareCampaignButton({
  campaignId,
  campaignTitle,
  variant = "outline",
  size = "sm",
  className,
  label = "Share",
}: ShareCampaignButtonProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () =>
    `${window.location.origin}/influencer/campaigns/available/${campaignId}`;

  const getMessage = () =>
    `Check out the "${campaignTitle}" campaign on 1man1000! Join as an influencer and get paid for your views: `;

  const openShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(getMessage() + getShareUrl());
    openShare(`https://wa.me/?text=${text}`);
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(getMessage());
    const url = encodeURIComponent(getShareUrl());
    openShare(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
  };

  const shareTelegram = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(getMessage());
    openShare(`https://t.me/share/url?url=${url}&text=${text}`);
  };

  const shareFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    const quote = encodeURIComponent(getMessage());
    openShare(
      `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`,
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getMessage() + getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. non-secure context) — no-op
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {copied ? (
            <>
              <Check className="mr-1.5 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="mr-1.5 h-4 w-4" />
              {label}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={shareWhatsApp}>
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareTelegram}>
          <Send className="mr-2 h-4 w-4" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareTwitter}>
          <Twitter className="mr-2 h-4 w-4" />
          X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareFacebook}>
          <Share2 className="mr-2 h-4 w-4" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>
          <Link2 className="mr-2 h-4 w-4" />
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

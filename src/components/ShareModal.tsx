import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { Copy, Link, Eye, Check } from 'lucide-react';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function ShareModal({ open, onClose, projectId }: ShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/shared/${projectId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast('Share link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Share Project" size="sm">
      <div className="px-6 py-5 space-y-5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
          <Eye className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">View-only access</p>
            <p className="text-xs opacity-80 mt-0.5">
              Anyone with this link can view the board but cannot make changes.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted mb-1.5 block">Shareable Link</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 min-w-0">
              <Link className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-300 truncate font-mono">{shareUrl}</span>
            </div>
            <Button
              variant={copied ? 'secondary' : 'primary'}
              size="sm"
              icon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-muted text-center">
            Share this link with stakeholders for read-only board access
          </p>
        </div>
      </div>
    </Modal>
  );
}

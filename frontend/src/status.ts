import type { IssueStatus } from './types';
import { colors } from './theme';

const STATUS_STYLES: Record<
  IssueStatus,
  { color: string; background: string; border: string }
> = {
  open: {
    color: colors.status.open,
    background: '#FEF2F2',
    border: '#FECACA',
  },
  in_progress: {
    color: colors.status.in_progress,
    background: '#FFFBEB',
    border: '#FDE68A',
  },
  resolved: {
    color: colors.status.resolved,
    background: '#F0FDF4',
    border: '#BBF7D0',
  },
};

export function getStatusTagStyle(status: IssueStatus) {
  return STATUS_STYLES[status];
}

import type { Meta, StoryObj } from '@storybook/angular';
import { CraftStatusBadge } from './status-badge';

const meta: Meta<CraftStatusBadge> = {
  title: 'Foundations/StatusBadge',
  component: CraftStatusBadge,
  args: {
    level: 'high',
    label: 'Готов',
  },
  parameters: {
    a11y: { test: 'error' },
  },
};

export default meta;
type Story = StoryObj<CraftStatusBadge>;

export const High: Story = {
  args: { level: 'high', label: 'Готов' },
};

export const Mid: Story = {
  args: { level: 'mid', label: 'Нужна помощь' },
};

export const Low: Story = {
  args: { level: 'low', label: 'Риск' },
};

export const KazakhLabels: Story = {
  args: { level: 'low', label: 'Тәуекел' },
};

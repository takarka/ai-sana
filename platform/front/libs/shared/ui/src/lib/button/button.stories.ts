import type { Meta, StoryObj } from '@storybook/angular';
import { CraftButton } from './button';

const meta: Meta<CraftButton & { label: string }> = {
  title: 'Foundations/Button',
  component: CraftButton,
  render: (args) => ({
    props: args,
    template: `<craft-button [variant]="variant" [disabled]="disabled">{{ label }}</craft-button>`,
  }),
  args: {
    variant: 'primary',
    disabled: false,
    label: 'Отправить',
  },
  parameters: {
    a11y: { test: 'error' },
  },
};

export default meta;
type Story = StoryObj<CraftButton & { label: string }>;

export const Primary: Story = {
  args: { variant: 'primary', label: 'Сохранить' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', label: 'Отмена' },
};

export const Solid: Story = {
  args: { variant: 'solid', label: 'Подробнее' },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, label: 'Недоступно' },
};

export const KazakhLabel: Story = {
  args: { variant: 'primary', label: 'Сақтау' },
};

import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CraftButton } from '@front/ui';
import { RevealOnScroll } from '../../shared/reveal/reveal-on-scroll';
import { SplitWords } from '../../shared/reveal/split-words';
import { openDemoModal } from '../../shared/demo-modal/demo-modal';

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  label: string;
}

interface ReadinessItem {
  label: string;
  percent: number;
  ready: boolean;
}

// Перенесено из eighth-version/js/page-pisa.js. Оригинал рисовал SVG
// императивно через document.createElementNS, измеряя host.clientWidth и
// перерисовывая график по resize/смене языка. План 04-landing-migration.md
// §4.3 требует статические SVG без анимации и лишнего интерактива — здесь
// геометрия считается один раз на фиксированном viewBox, а адаптивность даёт
// CSS-масштабирование (width: 100%) без JS и без слушателей resize.
const CHART_VALUES = [48, 59, 68, 79, 88];
const CHART_W = 620;
const CHART_H = 280;
const PAD_L = 40;
const PAD_R = 30;
const PAD_T = 36;
const PAD_B = 44;
const MIN_V = 30;
const MAX_V = 100;

function chartX(i: number): number {
  const iw = CHART_W - PAD_L - PAD_R;
  return PAD_L + (iw * i) / (CHART_VALUES.length - 1);
}

function chartY(v: number): number {
  const ih = CHART_H - PAD_T - PAD_B;
  return PAD_T + ih - (ih * (v - MIN_V)) / (MAX_V - MIN_V);
}

const CHART_LABELS = [
  $localize`:@@pisa.chart.label.0:Входной`,
  $localize`:@@pisa.chart.label.1:1 четверть`,
  $localize`:@@pisa.chart.label.2:2 четверть`,
  $localize`:@@pisa.chart.label.3:3 четверть`,
  $localize`:@@pisa.chart.label.4:Прогноз 2029`,
];

const CHART_GRID_VALUES = [40, 60, 80, 100];

const READINESS: ReadinessItem[] = [
  { label: $localize`:@@pisa.hard.media:Медиа- и ИИ-грамотность (PISA-2029)`, percent: 88, ready: true },
  { label: $localize`:@@pisa.hard.math:Математическая грамотность`, percent: 79, ready: true },
  { label: $localize`:@@pisa.hard.read:Читательская грамотность`, percent: 68, ready: true },
  { label: $localize`:@@pisa.hard.science:Естественно-научные гипотезы`, percent: 48, ready: false },
];

@Component({
  selector: 'app-pisa',
  imports: [CraftButton, RevealOnScroll, SplitWords],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pisa.html',
  styleUrl: './pisa.scss',
})
export class Pisa {
  private readonly dialog = inject(Dialog);

  protected readonly chartViewBox = `0 0 ${CHART_W} ${CHART_H}`;
  protected readonly chartAxisY = PAD_T + (CHART_H - PAD_T - PAD_B);
  protected readonly chartPadL = PAD_L;
  protected readonly chartPadR = CHART_W - PAD_R;
  protected readonly chartLabelY = CHART_H - 14;
  protected readonly chartAria = $localize`:@@pisa.chart.aria:Динамика готовности параллелей школы к PISA-2029`;

  protected readonly gridLines = CHART_GRID_VALUES.map((tv) => ({ value: tv, y: chartY(tv) }));

  protected readonly points: ChartPoint[] = CHART_VALUES.map((v, i) => ({
    x: chartX(i),
    y: chartY(v),
    value: v,
    label: CHART_LABELS[i],
  }));

  protected readonly linePath = this.points
    .map((point, i) => {
      if (i === 0) return `M${point.x} ${point.y}`;
      const prev = this.points[i - 1];
      const cx = (prev.x + point.x) / 2;
      return `C${cx} ${prev.y} ${cx} ${point.y} ${point.x} ${point.y}`;
    })
    .join(' ');

  protected readonly readiness = READINESS;

  protected labelAnchor(i: number): 'start' | 'middle' | 'end' {
    if (i === 0) return 'start';
    if (i === this.points.length - 1) return 'end';
    return 'middle';
  }

  protected openDemo(): void {
    openDemoModal(this.dialog);
  }
}

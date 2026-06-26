import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { T } from '../../t.const';
import { DatePickerInputComponent } from '../date-picker-input/date-picker-input.component';
import { getDbDateStr } from '../../util/get-db-date-str';
import { dateStrToUtcDate } from '../../util/date-str-to-utc-date';

export interface DialogDatePickerData {
  label: string;
  value?: string | null;
}

@Component({
  selector: 'dialog-date-picker',
  templateUrl: './dialog-date-picker.component.html',
  styleUrl: './dialog-date-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePickerInputComponent,
    FormsModule,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatIcon,
    TranslatePipe,
  ],
})
export class DialogDatePickerComponent {
  private readonly _matDialogRef =
    inject<MatDialogRef<DialogDatePickerComponent>>(MatDialogRef);
  readonly data = inject<DialogDatePickerData>(MAT_DIALOG_DATA);

  readonly T: typeof T = T;
  selectedDate: Date | null = null;

  constructor() {
    if (this.data.value) {
      this.selectedDate = dateStrToUtcDate(this.data.value);
    }
  }

  clear(): void {
    this._matDialogRef.close(null);
  }

  close(): void {
    this._matDialogRef.close(undefined);
  }

  save(): void {
    this._matDialogRef.close(this.selectedDate ? getDbDateStr(this.selectedDate) : null);
  }
}

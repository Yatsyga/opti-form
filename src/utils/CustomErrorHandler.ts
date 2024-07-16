import { ControlType } from '../ControlType';
import { TControlExternalErrorFlat } from '../TControlExternalErrorFlat';
import {
  TControlDataArray,
  TControlDataBasic,
  TControlDataObject,
} from '../control-data';
import { TControlCustomError } from '../types';
import { TControlArrayValue, TControlObjectValue } from '../values';

type IAnyData =
  | TControlDataBasic<any, any>
  | TControlDataObject<TControlObjectValue, any>
  | TControlDataArray<TControlArrayValue, any>;

const ENDING_REGEXP_CONTENT = `(\\.|\\[|$)`;

export class CustomErrorHandler<Value extends TControlObjectValue> {
  constructor(private readonly rootField: TControlDataObject<Value, any>) {}

  /**
   * This whole overcomplicated logic is required in case come genius names object's property like baz[1]inga or baz.in.ga
   */
  public getCustomErrorsFromFlatList(
    flatErrors: TControlExternalErrorFlat[]
  ): TControlCustomError[] {
    const result: TControlCustomError[] = [];

    this.fillFlatErrorsByField(result, flatErrors, null, this.rootField as IAnyData, []);

    return result;
  }

  private fillFlatErrorsByField(
    result: TControlCustomError[],
    errors: TControlExternalErrorFlat[],
    fieldName: string | null,
    fieldData: IAnyData,
    fieldPath: string[]
  ): void {
    const childrenErrorsMap: Record<string, TControlExternalErrorFlat[]> = {};
    const childRegexp = this.getChildrenRegexp(fieldData);

    errors.forEach(({ error, path }) => {
      const raw = String.raw`${fieldName}`;
      const pathMatch = path.match(new RegExp(`^(${raw}|\\[${raw}\\])${ENDING_REGEXP_CONTENT}`));

      if (!pathMatch && fieldName !== null) {
        return;
      }

      const remainingPath = fieldName === null ? path : this.getRemainingFlatPath(path, pathMatch!);
      if (!remainingPath) {
        result.push({ path: fieldPath, error });
        return;
      }

      const childMatch = childRegexp ? remainingPath.match(childRegexp) : null;
      if (!childMatch) {
        return;
      }

      const child = childMatch[2] ?? childMatch[3];
      if (!childrenErrorsMap[child]) {
        childrenErrorsMap[child] = [];
      }
      childrenErrorsMap[child].push({ error, path: remainingPath });
    });

    for (const key in childrenErrorsMap) {
      const child = this.getChild(key, fieldData);
      if (!child) {
        continue;
      }

      this.fillFlatErrorsByField(result, childrenErrorsMap[key], key, child, fieldPath.concat([key]));
    }
  }

  private getChildrenRegexp(fieldData: IAnyData): RegExp | null {
    const content = (() => {
      switch (fieldData.type) {
        case ControlType.basic:
          return null;
        case ControlType.object:
          return `${Object.keys(fieldData.fieldsData)
            .map((text) => String.raw`${text}`)
            .join('|')}`;
        case ControlType.array:
          return `\\d+`;
      }
    })();

    if (!content) {
      return null;
    }

    return new RegExp(`^((${content})|\\[(${content})\\])${ENDING_REGEXP_CONTENT}`);
  }

  private getChild(key: string, fieldData: IAnyData): IAnyData | null {
    switch (fieldData.type) {
      case ControlType.basic:
        return null;
      case ControlType.object:
        return fieldData.fieldsData[key] ?? null;
      case ControlType.array:
        return fieldData.childData;
    }
  }

  private getRemainingFlatPath(path: string, [match, prop, finish]: RegExpMatchArray): string {
    let resultPre = path.slice(finish === '[' ? prop.length : match.length);
    if (resultPre[0] === '.') {
      resultPre = resultPre.slice(1);
    }
    return resultPre;
  }
}

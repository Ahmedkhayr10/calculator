import { useReducer } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAX_DIGITS = 12;

type Operator = '+' | '−' | '×' | '÷';

type CalculatorState = {
  current: string;
  prev: number | null;
  op: Operator | null;
  overwrite: boolean;
  expression: string;
  error: boolean;
};

type CalculatorAction =
  | { type: 'digit'; value: string }
  | { type: 'operator'; value: Operator }
  | { type: 'dot' | 'equals' | 'percent' | 'negate' | 'backspace' | 'clear' };

const initialState: CalculatorState = {
  current: '0',
  prev: null,
  op: null,
  overwrite: false,
  expression: '',
  error: false,
};

const COLORS = {
  body: '#1B2432',
  display: '#10161F',
  displayText: '#F2F4F7',
  muted: '#7F8CA3',
  key: '#2B3547',
  keyText: '#F2F4F7',
  fn: '#3C4A63',
  op: '#4C8DFF',
  opActive: '#FFFFFF',
  opActiveText: '#4C8DFF',
  equals: '#F2B705',
  equalsText: '#1B2432',
};

function compute(a: number, b: number, op: Operator): number {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? Number.NaN : a / b;
  }
}

function clean(value: number): string {
  return String(Number.parseFloat(value.toPrecision(12)));
}

function format(value: string): string {
  if (value === 'Error') return value;
  const negative = value.startsWith('-');
  const body = negative ? value.slice(1) : value;
  if (body.includes('e')) return value;
  const [integer, decimal] = body.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${grouped}${decimal !== undefined ? `.${decimal}` : ''}`;
}

function reducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  if (state.error && action.type !== 'clear') {
    state = initialState;
  }

  switch (action.type) {
    case 'digit': {
      if (state.overwrite) {
        return { ...state, current: action.value, overwrite: false };
      }
      if (state.current === '0') return { ...state, current: action.value };
      if (state.current.replace(/[-.]/g, '').length >= MAX_DIGITS) return state;
      return { ...state, current: state.current + action.value };
    }
    case 'dot':
      if (state.overwrite) return { ...state, current: '0.', overwrite: false };
      if (state.current.includes('.')) return state;
      return { ...state, current: `${state.current}.` };
    case 'operator': {
      const value = Number.parseFloat(state.current);
      let left = value;

      if (state.prev !== null && state.op && !state.overwrite) {
        left = compute(state.prev, value, state.op);
        if (!Number.isFinite(left)) {
          return { ...initialState, current: 'Error', error: true };
        }
        left = Number.parseFloat(clean(left));
      } else if (state.prev !== null && state.op && state.overwrite) {
        left = state.prev;
      }

      return {
        ...state,
        prev: left,
        op: action.value,
        current: String(left),
        overwrite: true,
        expression: `${format(String(left))} ${action.value}`,
      };
    }
    case 'equals': {
      if (!state.op || state.prev === null) return state;
      const right = Number.parseFloat(state.current);
      const result = compute(state.prev, right, state.op);
      const expression = `${format(String(state.prev))} ${state.op} ${format(String(right))} =`;
      if (!Number.isFinite(result)) {
        return { ...initialState, current: 'Error', expression, error: true };
      }
      return { ...initialState, current: clean(result), expression, overwrite: true };
    }
    case 'percent':
      return {
        ...state,
        current: clean(Number.parseFloat(state.current) / 100),
        overwrite: true,
      };
    case 'negate':
      if (state.current === '0') return state;
      return {
        ...state,
        current: state.current.startsWith('-') ? state.current.slice(1) : `-${state.current}`,
      };
    case 'backspace': {
      if (state.overwrite) return state;
      const next = state.current.slice(0, -1);
      return { ...state, current: next === '' || next === '-' ? '0' : next };
    }
    case 'clear':
      return initialState;
    default:
      return state;
  }
}

type KeyProps = {
  label: string;
  onPress: () => void;
  variant?: 'num' | 'op' | 'fn' | 'equals';
  flex?: number;
  active?: boolean;
};

function Key({ label, onPress, variant = 'num', flex = 1, active = false }: KeyProps) {
  const backgroundColor =
    variant === 'op'
      ? active
        ? COLORS.opActive
        : COLORS.op
      : variant === 'fn'
        ? COLORS.fn
        : variant === 'equals'
          ? COLORS.equals
          : COLORS.key;
  const color =
    variant === 'equals'
      ? COLORS.equalsText
      : variant === 'op' && active
        ? COLORS.opActiveText
        : COLORS.keyText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        { flex, backgroundColor, opacity: pressed ? 0.7 : 1 },
      ]}>
      <Text style={[styles.keyText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export default function CalculatorScreen() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const digit = (value: string) => () => dispatch({ type: 'digit', value });
  const operator = (value: Operator) => () => dispatch({ type: 'operator', value });
  const isActive = (value: Operator) => state.op === value && state.overwrite;
  const hasInput = state.current !== '0' || state.op !== null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.displayWrap}>
        <Text style={styles.expression} numberOfLines={1}>
          {state.expression}
        </Text>
        <Text
          style={styles.result}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
          accessibilityLiveRegion="polite">
          {format(state.current)}
        </Text>
        <Pressable
          onPress={() => dispatch({ type: 'backspace' })}
          style={styles.backspace}
          accessibilityRole="button"
          accessibilityLabel="Delete last digit"
          hitSlop={12}>
          <Text style={styles.backspaceText}>⌫</Text>
        </Pressable>
      </View>

      <View style={styles.pad}>
        <View style={styles.row}>
          <Key label={hasInput ? 'C' : 'AC'} variant="fn" onPress={() => dispatch({ type: 'clear' })} />
          <Key label="±" variant="fn" onPress={() => dispatch({ type: 'negate' })} />
          <Key label="%" variant="fn" onPress={() => dispatch({ type: 'percent' })} />
          <Key label="÷" variant="op" active={isActive('÷')} onPress={operator('÷')} />
        </View>
        <View style={styles.row}>
          <Key label="7" onPress={digit('7')} />
          <Key label="8" onPress={digit('8')} />
          <Key label="9" onPress={digit('9')} />
          <Key label="×" variant="op" active={isActive('×')} onPress={operator('×')} />
        </View>
        <View style={styles.row}>
          <Key label="4" onPress={digit('4')} />
          <Key label="5" onPress={digit('5')} />
          <Key label="6" onPress={digit('6')} />
          <Key label="−" variant="op" active={isActive('−')} onPress={operator('−')} />
        </View>
        <View style={styles.row}>
          <Key label="1" onPress={digit('1')} />
          <Key label="2" onPress={digit('2')} />
          <Key label="3" onPress={digit('3')} />
          <Key label="+" variant="op" active={isActive('+')} onPress={operator('+')} />
        </View>
        <View style={styles.row}>
          <Key label="0" flex={2} onPress={digit('0')} />
          <Key label="." onPress={() => dispatch({ type: 'dot' })} />
          <Key label="=" variant="equals" onPress={() => dispatch({ type: 'equals' })} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.body,
  },
  displayWrap: {
    flex: 1,
    margin: 16,
    marginBottom: 8,
    padding: 20,
    paddingBottom: 16,
    borderRadius: 20,
    backgroundColor: COLORS.display,
    justifyContent: 'flex-end',
  },
  expression: {
    color: COLORS.muted,
    fontSize: 20,
    textAlign: 'right',
    minHeight: 28,
  },
  result: {
    color: COLORS.displayText,
    fontSize: 72,
    fontWeight: '300',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  backspace: {
    position: 'absolute',
    top: 14,
    left: 18,
    padding: 4,
  },
  backspaceText: {
    color: COLORS.muted,
    fontSize: 24,
  },
  pad: {
    padding: 12,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  key: {
    height: 68,
    margin: 5,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 30,
    fontWeight: '400',
  },
});

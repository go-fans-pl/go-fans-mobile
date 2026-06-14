import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

// W buildzie release RedBox jest wyłączony — niezłapany wyjątek w renderze daje
// pusty biały ekran. Ten boundary łapie go i pokazuje treść błędu, żeby diagnoza
// na TestFlight nie wymagała zgadywania.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Coś poszło nie tak</Text>
          <Text style={styles.subtitle}>
            Aplikacja napotkała błąd. Pokaż ten ekran deweloperowi.
          </Text>
          <Text style={styles.errName}>{error?.name || 'Error'}</Text>
          <Text style={styles.errMsg}>{error?.message || String(error)}</Text>
          {error?.stack ? (
            <Text style={styles.stack}>{error.stack}</Text>
          ) : null}
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Spróbuj ponownie</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: 24, paddingTop: 80 },
  title: { fontSize: 22, fontWeight: '800', color: '#0A0A0A' },
  subtitle: { fontSize: 14, color: '#71717A', marginTop: 8, marginBottom: 20 },
  errName: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  errMsg: { fontSize: 14, color: '#0A0A0A', marginTop: 4 },
  stack: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 16,
    fontFamily: 'Courier',
  },
  button: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

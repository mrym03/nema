import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/utils/AuthContext";
import Colors from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { signIn, signUp, loading } = useAuth();
  const router = useRouter();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Trigger animation when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password);
        Alert.alert("Success", "Account created successfully");
      } else {
        await signIn(email, password);
        console.log("Authentication successful");
      }
    } catch (error) {
      console.error("Auth error:", error);
      Alert.alert(
        "Authentication Error",
        isSignUp ? "Failed to create account" : "Invalid email or password"
      );
    }
  };

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.animatedContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Logo and App Name */}
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/nemalogo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.subtitle}>Every meal is a gift.</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.authTitle}>
                {isSignUp ? "Create Account" : "Welcome Back"}
              </Text>
              <Text style={styles.authSubtitle}>
                {isSignUp
                  ? "Join our community of food savers"
                  : "Sign in to continue your journey"}
              </Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={Colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                />
                <TouchableOpacity
                  onPress={toggleSecureEntry}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={Colors.textLight}
                  />
                </TouchableOpacity>
              </View>

              {/* Sign In / Sign Up Button */}
              <TouchableOpacity
                style={styles.authButton}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <>
                    <Text style={styles.authButtonText}>
                      {isSignUp ? "Create Account" : "Sign In"}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#FFFFFF"
                      style={styles.buttonIcon}
                    />
                  </>
                )}
              </TouchableOpacity>

              {/* Switch between Sign In / Sign Up */}
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsSignUp(!isSignUp)}
                activeOpacity={0.7}
              >
                <Text style={styles.switchButtonText}>
                  {isSignUp
                    ? "Already have an account? "
                    : "Don't have an account? "}
                  <Text style={styles.switchButtonHighlight}>
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Terms and Privacy */}
            <Text style={styles.termsText}>
              By signing in, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  animatedContainer: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight + "30",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  eyeIcon: {
    padding: 8,
  },
  authButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  authButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginLeft: 8,
  },
  switchButton: {
    padding: 4,
    alignItems: "center",
  },
  switchButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    textAlign: "center",
  },
  switchButtonHighlight: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  termsText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
    marginTop: 12,
    maxWidth: "80%",
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: "500",
  },
});

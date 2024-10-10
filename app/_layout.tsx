import { Stack } from "expo-router";
import { ApolloProvider } from "@apollo/client";
import client from "../services/client";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Image, StyleSheet, View, Text } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const Logoheader = () => {
    return (
      <Image
        style={styles.image}
        source={require("../assets/images/icon.png")}
      ></Image>
    );
  };

  return (
    <ApolloProvider client={client}>
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: (props) => <Logoheader {...props} />,
          }}
          name="[author]"
          getId={({ params }) => String(Date.now())}
        />
      </Stack>
    </ApolloProvider>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 50,
    height: 50,
  },
});

package cn.toside.music.mobile;

import android.os.Bundle; // here
import com.reactnativenavigation.NavigationActivity;

import org.devio.rn.splashscreen.SplashScreen; // here

public class MainActivity extends NavigationActivity {
  @Override
    protected void onCreate(Bundle savedInstanceState) {
      SplashScreen.show(this, R.style.SplashScreenTheme, true);  // here
      super.onCreate(savedInstanceState);
    }
}

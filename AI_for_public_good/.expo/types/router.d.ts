/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/explore`; params?: Router.UnknownInputParams; } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/../types/types`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/pages/Dashboard`; params?: Router.UnknownInputParams; } | { pathname: `/pages/Login`; params?: Router.UnknownInputParams; } | { pathname: `/pages/Onboarding`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/explore`; params?: Router.UnknownOutputParams; } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/../types/types`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `/pages/Dashboard`; params?: Router.UnknownOutputParams; } | { pathname: `/pages/Login`; params?: Router.UnknownOutputParams; } | { pathname: `/pages/Onboarding`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/explore${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `/../types/types${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | `/pages/Dashboard${`?${string}` | `#${string}` | ''}` | `/pages/Login${`?${string}` | `#${string}` | ''}` | `/pages/Onboarding${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/explore`; params?: Router.UnknownInputParams; } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/../types/types`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/pages/Dashboard`; params?: Router.UnknownInputParams; } | { pathname: `/pages/Login`; params?: Router.UnknownInputParams; } | { pathname: `/pages/Onboarding`; params?: Router.UnknownInputParams; };
    }
  }
}

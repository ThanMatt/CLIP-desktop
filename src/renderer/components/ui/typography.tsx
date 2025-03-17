import * as React from "react";
import { cn } from "@/lib/utils";

// :: Base components props should extend the HTML attributes instead of having a separate interface
type BaseProps<T> = React.HTMLAttributes<T> & {
  className?: string;
  children?: React.ReactNode;
};

// :: Specific element props
type HeadingProps = BaseProps<HTMLHeadingElement>;
type ParagraphProps = BaseProps<HTMLParagraphElement>;
type ListProps = BaseProps<HTMLUListElement> & {
  items?: string[];
};

// H1 Component
export const H1 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6",
        className
      )}
      {...props}
    />
  )
);
H1.displayName = "H1";

// H2 Component
export const H2 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "scroll-m-20 pb-2 font-sans text-3xl font-semibold tracking-tight first:mt-0 mb-4",
        className
      )}
      {...props}
    />
  )
);
H2.displayName = "H2";

// H3 Component
export const H3 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "scroll-m-20 text-2xl font-sans font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
);
H3.displayName = "H3";

// H4 Component
export const H4 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn(
        "scroll-m-20 text-xl font-sans font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
);
H4.displayName = "H4";

// Paragraph Component
export const Text = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "leading-7 font-sans [&:not(:first-child)]:mt-6",
        className
      )}
      {...props}
    />
  )
);
Text.displayName = "Text";

// Large Text Component
export const Large = React.forwardRef<
  HTMLDivElement,
  BaseProps<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-lg font-sans font-semibold", className)}
    {...props}
  />
));
Large.displayName = "Large";

// Small Text Component
export const Small = React.forwardRef<HTMLElement, BaseProps<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <small
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  )
);
Small.displayName = "Small";

// Subtle Text Component
export const Subtle = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
Subtle.displayName = "Subtle";

// Lead Paragraph Component
export const Lead = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-xl text-muted-foreground", className)}
      {...props}
    />
  )
);
Lead.displayName = "Lead";

// Blockquote Component
export const Blockquote = React.forwardRef<
  HTMLQuoteElement,
  BaseProps<HTMLQuoteElement>
>(({ className, ...props }, ref) => (
  <blockquote
    ref={ref}
    className={cn(
      "mt-6 border-l-2 pl-6 italic [&>*]:text-muted-foreground",
      className
    )}
    {...props}
  />
));
Blockquote.displayName = "Blockquote";

// List Component
export const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, items, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    >
      {items?.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
);
List.displayName = "List";

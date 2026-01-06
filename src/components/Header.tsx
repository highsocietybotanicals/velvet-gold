import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.jpeg";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Le Coffre" },
  { href: "/#sommelier", label: "Le Sommelier" },
  { href: "/#societe", label: "La Société" },
  { href: "/#contact", label: "Contact" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const location = useLocation();

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    
    // If it's a hash link and we're on the home page, scroll to section
    if (href.startsWith("/#") && location.pathname === "/") {
      const element = document.getElementById(href.substring(2));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const renderLink = (link: { href: string; label: string }, index: number, isMobile = false) => {
    const isHashLink = link.href.startsWith("/#");
    const isActive = location.pathname === link.href || (location.pathname === "/" && link.href === "/");

    if (isHashLink) {
      return (
        <motion.a
          key={link.href}
          href={link.href}
          initial={{ opacity: 0, y: isMobile ? 0 : -10, x: isMobile ? -20 : 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ delay: isMobile ? 0.05 * index : 0.1 * index }}
          onClick={() => handleNavClick(link.href)}
          className={
            isMobile
              ? "text-lg text-foreground hover:text-primary transition-colors py-2 font-display"
              : "text-sm text-muted-foreground hover:text-primary transition-colors duration-300 tracking-wide uppercase font-body"
          }
        >
          {link.label}
        </motion.a>
      );
    }

    return (
      <motion.div
        key={link.href}
        initial={{ opacity: 0, y: isMobile ? 0 : -10, x: isMobile ? -20 : 0 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: isMobile ? 0.05 * index : 0.1 * index }}
      >
        <Link
          to={link.href}
          onClick={() => setIsMenuOpen(false)}
          className={
            isMobile
              ? `text-lg hover:text-primary transition-colors py-2 font-display ${isActive ? "text-primary" : "text-foreground"}`
              : `text-sm hover:text-primary transition-colors duration-300 tracking-wide uppercase font-body ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          {link.label}
        </Link>
      </motion.div>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md border-b border-border/50" />

      <div className="relative container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link to="/" className="flex items-center gap-3">
              <img
                src={logo}
                alt="High Society Botanicals"
                className="w-12 h-12 object-contain rounded"
              />
              <div className="hidden md:block">
                <h1 className="font-display text-lg text-primary leading-none">
                  High Society
                </h1>
                <p className="text-xs text-muted-foreground tracking-widest uppercase">
                  Botanicals
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, i) => renderLink(link, i))}
          </nav>

          {/* Cart & CTA */}
          <div className="flex items-center gap-4">
            {/* Cart button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 hover:bg-muted rounded-full transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium"
                >
                  {totalItems}
                </motion.span>
              )}
            </motion.button>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:block"
            >
              <Link to="/catalogue" className="btn-luxury-outline text-xs py-3 px-6">
                Découvrir
              </Link>
            </motion.div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-primary p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <nav className="container mx-auto px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link, i) => renderLink(link, i, true))}
              <Link
                to="/catalogue"
                onClick={() => setIsMenuOpen(false)}
                className="btn-luxury text-center mt-4"
              >
                Découvrir
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;

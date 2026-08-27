export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 text-slate-400 py-12 border-t border-slate-900 mt-auto relative z-10">
      <div className="w-full px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-white font-black text-xl mb-2 tracking-tight">KelanaAI</h3>
          <p className="text-sm font-medium">© {new Date().getFullYear()} KelanaAI Inc. All rights reserved.</p>
        </div>
        
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-semibold">
          <a href="#" className="hover:text-white transition-colors">About Us</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </nav>
      </div>
    </footer>
  );
}

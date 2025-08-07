-- Sample products for AV industry to populate dropdowns and test functionality
-- Run this in Supabase SQL Editor to add initial product data

BEGIN;

-- Sample products with common AV industry brands and categories
INSERT INTO products (
  product_id,
  brand,
  category,
  product_name,
  product_number,
  description,
  dealer_price,
  msrp,
  map_price,
  primary_distributor,
  spec_sheet_url,
  image_url
) VALUES 
-- Samsung Displays
('PROD001', 'Samsung', 'Displays', 'Samsung QM85R 85" 4K UHD Commercial Display', 'QM85R', 'Professional 4K UHD display with Tizen 4.0 and MagicINFO compatibility', 3299.00, 4999.00, 3999.00, 'Almo Professional A/V', 'https://displaysolutions.samsung.com/digital-signage/detail/1839/QM85R', 'https://displaysolutions.samsung.com/images/detail/1839/QM85R-1.jpg'),

('PROD002', 'Samsung', 'Displays', 'Samsung QM65R 65" 4K UHD Commercial Display', 'QM65R', 'Professional 4K UHD display with Tizen 4.0 and MagicINFO compatibility', 1899.00, 2999.00, 2399.00, 'Almo Professional A/V', 'https://displaysolutions.samsung.com/digital-signage/detail/1837/QM65R', 'https://displaysolutions.samsung.com/images/detail/1837/QM65R-1.jpg'),

-- Sony Displays  
('PROD003', 'Sony', 'Displays', 'Sony FW-85BZ40H 85" 4K HDR Professional Display', 'FW-85BZ40H', 'Professional 4K HDR display with Android platform and Pro Mode', 4199.00, 6299.00, 5099.00, 'Almo Professional A/V', 'https://pro.sony/ue_US/products/professional-displays/fw-85bz40h', 'https://pro.sony/s3/2021/03/11160244/FW-BZ40H-b1.jpg'),

('PROD004', 'Sony', 'Displays', 'Sony FW-65BZ40H 65" 4K HDR Professional Display', 'FW-65BZ40H', 'Professional 4K HDR display with Android platform and Pro Mode', 2399.00, 3799.00, 2999.00, 'Almo Professional A/V', 'https://pro.sony/ue_US/products/professional-displays/fw-65bz40h', 'https://pro.sony/s3/2021/03/11160244/FW-BZ40H-b1.jpg'),

-- Crestron Control Systems
('PROD005', 'Crestron', 'Control Systems', 'Crestron CP4 4-Series Control System', 'CP4', 'Enterprise-grade control system with 4-Series architecture and secure networking', 1299.00, 1999.00, 1599.00, 'ADI Global Distribution', 'https://www.crestron.com/Products/Control-Hardware-Software/Hardware/Control-Systems/CP4', 'https://www.crestron.com/getmedia/0f8c2e7c-8a8c-4e1d-9f3e-9a8c0c6e7c8d/cp4-1'),

('PROD006', 'Crestron', 'Control Systems', 'Crestron TSW-760 7" Touch Screen', 'TSW-760', '7-inch capacitive touch screen with WiFi connectivity and intuitive interface', 899.00, 1399.00, 1119.00, 'ADI Global Distribution', 'https://www.crestron.com/Products/Control-Hardware-Software/Hardware/Touch-Screens/TSW-760', 'https://www.crestron.com/getmedia/0f8c2e7c-8a8c-4e1d-9f3e-9a8c0c6e7c8d/tsw-760-1'),

-- QSC Audio
('PROD007', 'QSC', 'Audio', 'QSC CP8T 8" Ceiling Speaker', 'CP8T', 'Professional 8-inch ceiling speaker with 70V/100V transformer', 189.00, 299.00, 239.00, 'Almo Professional A/V', 'https://www.qsc.com/solutions-products/loudspeakers/ceiling-speakers/cp8t/', 'https://www.qsc.com/resource-files/productimages/CP8T_angle_white.jpg'),

('PROD008', 'QSC', 'Audio', 'QSC K12.2 Powered Speaker', 'K12.2', '12-inch 2-way powered loudspeaker with 2000W Class-D amplifier', 699.00, 1099.00, 879.00, 'Guitar Center Pro', 'https://www.qsc.com/solutions-products/loudspeakers/portable-loudspeakers/k-series/k12-2/', 'https://www.qsc.com/resource-files/productimages/K12.2_angle.jpg'),

-- Shure Audio
('PROD009', 'Shure', 'Audio', 'Shure MXA910 Ceiling Array Microphone', 'MXA910', 'Ceiling array microphone with steerable coverage and Dante networking', 1899.00, 2799.00, 2299.00, 'Almo Professional A/V', 'https://www.shure.com/en-US/products/microphones/mxa910', 'https://pim-resources.shure.com/resource/device/image/upload/mxa910_top_angle_001.jpg'),

('PROD010', 'Shure', 'Audio', 'Shure QLXD14/85 Wireless Lavalier System', 'QLXD14/85', 'Digital wireless lavalier microphone system with WL185 cardioid lavalier mic', 599.00, 899.00, 719.00, 'Guitar Center Pro', 'https://www.shure.com/en-US/products/wireless-systems/qlxd-wireless-systems/qlxd14-85', 'https://pim-resources.shure.com/resource/device/image/upload/qlxd14_85_001.jpg'),

-- Extron Video Distribution
('PROD011', 'Extron', 'Video Distribution', 'Extron DTP T UWP 231 4K Wallplate Transmitter', 'DTP-T-UWP-231', '4K/60 4:4:4 HDMI wallplate transmitter with USB and control over DTP', 249.00, 399.00, 319.00, 'ADI Global Distribution', 'https://www.extron.com/product/dtp-t-uwp-231', 'https://www.extron.com/images/products/dtp-t-uwp-231-lg.jpg'),

('PROD012', 'Extron', 'Video Distribution', 'Extron DTP CrossPoint 84 4K Matrix Switcher', 'DTP-CP-84-4K', '8x4 4K/60 matrix switcher with integrated DTP and HDMI connectivity', 2199.00, 3299.00, 2639.00, 'ADI Global Distribution', 'https://www.extron.com/product/dtp-crosspoint-84-4k', 'https://www.extron.com/images/products/dtp-crosspoint-84-4k-lg.jpg');

COMMIT;
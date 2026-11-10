import { join } from "node:path";
import { existsSync } from "node:fs";
import pug from "pug";
import pugCt from "../lib/ct.js";
import webcLsIgnore from "../lib/import/webcLsIgnore.js";

export default (root) => {
  const ignorePromise = webcLsIgnore(root);

  return (component_name) => async (read) => {
    const component_web_path = "/src/webc/" + component_name,
      component_dir = root + component_web_path,
      pug_path = join(component_dir, "demo", "_.pug"),
      default_pug_path = join(root, "src", "pug", "default.pug");

    if (!existsSync(pug_path)) {
      throw new Error("Component demo template not found: " + pug_path);
    }

    const ignore = await ignorePromise,
      back = ignore.test(component_name) ? "" : '<c-back href="/"></c-back>',
      // 1. 编译组件的 _.pug 为 body HTML
      [raw_body_html] = pugCt(pug_path, read),
      body_html =
        '<c-vs><nav class="Nav"><c-nav>' +
        back +
        "</c-nav><c-nav><c-i18n></c-i18n></c-nav></nav>" +
        raw_body_html +
        "</c-vs>",
      // 2. 构建模板局部变量
      css_li = ["/src/styl/_.styl", "/src/styl/demo.styl"],
      demo_styl_path = join(component_dir, "demo", "_.styl"),
      js_src_li = ["/src/js/demo.js"],
      comp_js_path = component_dir + ".js",
      js_li = ['import init from "' + component_web_path + '/demo/_.js";init(document);'];

    if (existsSync(demo_styl_path)) {
      css_li.push(component_web_path + "/demo/_.styl");
    }
    if (existsSync(comp_js_path)) {
      js_src_li.push(component_web_path + ".js");
    }

    // 3. 使用 body_html 渲染 default_pug_path
    return pug.renderFile(default_pug_path, {
      filename: default_pug_path,
      pretty: true,
      title: component_name,
      body: body_html,
      css_li,
      js_src_li,
      js_li
    });
  };
};
